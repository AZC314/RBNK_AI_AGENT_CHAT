import {AppStorage} from '@/stores/AppStorage'
import {TOKEN,REF_TOKEN } from '@/constances/constances'
import GeneralServices from '@/api/GeneralServices'

export enum HttpStatus {
  SUCCESS = 200, // 请求成功
  NO_AUTH = 401, // token失效
  NOT_FOUND = 404, // 请求资源不存在
}

interface EnvType {
  DEVELOPER?: string
  TEST?: string
  PRODUCT?: string
}

interface ConfigType {
  EnvBase?: EnvType
  Host?: string
  Header?: Function
  NotAuthPage?: string
}

class Request {
  public config: ConfigType = {}
  private WhiteList: string[] = []
  public onNotAuthChange?: Function
  static instance: Request | undefined

  setWhiteList(apis: string[]) {
    this.WhiteList = apis
  }

  private isWhiteList(api: string) {
    return this.WhiteList.some((item) => api.includes(item))
  }

  private getHeader(api: string, customHeader?: object) {
    if (this.isWhiteList(api)) {
      return { 'Content-Type': 'application/json' }
    }
    if (customHeader) return customHeader
    if (this.config.Header) {
      return this.config.Header()
    }
    return undefined
  }

  async request(
    api: string,
    method: 'GET' | 'POST' | 'DELETE',
    data?: object,
    header?: object
  ): Promise<object> {
    const url = this.config.Host + api
    const reqHeader = this.getHeader(api, header)

    // 定义重新发请求的方法
    const doRequest = (): Promise<object> => {
      return new Promise((resolve, reject) => {
        uni.request({
          url,
          method,
          data,
          header: reqHeader,
          success: async (res) => {
            if (res.statusCode === HttpStatus.SUCCESS) {
              resolve(res.data)
              return
            }

            if (res.statusCode === HttpStatus.NO_AUTH) {
              // 自动刷新token
              const refToken = AppStorage.get(REF_TOKEN)
              if (refToken) {
                try {
                  const refreshRes: any = await this.request(
                    '/api/auth/refresh',
                    'POST',
                    { refresh_token: refToken }
                  )
                  AppStorage.set(TOKEN, refreshRes.access_token)
                  AppStorage.set(REF_TOKEN, refreshRes.refresh_token)
                  // 刷新成功后重新执行原请求
                  resolve(await doRequest())
                } catch (e) {
                  // 刷新也失败
                  if (this.onNotAuthChange) this.onNotAuthChange()
                  uni.showToast({ title: '登录超时', icon: 'none', duration: 2000 })
                  uni.redirectTo({ url: '/pages/index/index' })
                  reject(e)
                }
              } else {
                // 没有刷新token
                if (this.onNotAuthChange) this.onNotAuthChange()
                uni.showToast({ title: '登录超时', icon: 'none', duration: 2000 })
                uni.redirectTo({ url: '/pages/index/index' })
				GeneralServices.clearStore()
                reject(res)
              }
              return
            }

            // 其他错误直接reject
            reject(res)
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
    }

    return doRequest()
  }

  get(api: string, params?: object, header?: object) {
    return this.request(api, 'GET', params, header)
  }

  post(api: string, params?: object, header?: object) {
    return this.request(api, 'POST', params, header)
  }

  delete(api: string, params?: object, header?: object) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return this.request(api + queryString, 'DELETE', undefined, header)
  }

  // 新增：流式POST（SSE）支持
  async postStream(
    api: string,
    params?: object,
    header?: object,
    getWorkflowInfo?: (options: Record<string, string>) => void,
    onChar?: (char: string, messageId: string) => void,
    onDone?: () => void
  ) {
    const url = this.config.Host + api;
    const reqHeader = this.getHeader(api, header);
    const refToken = AppStorage.get(REF_TOKEN);
    const doStream = async (tokenOverride?: string): Promise<void> => {
      let finalHeader = { ...reqHeader };
      if (tokenOverride) {
        finalHeader['Authorization'] = `Bearer ${tokenOverride}`;
      }
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: finalHeader,
          body: JSON.stringify(params)
        });
        if (resp.status === HttpStatus.NO_AUTH) {
          // token失效，自动刷新token
          if (refToken) {
            const refreshRes: any = await this.request(
              '/api/auth/refresh',
              'POST',
              { refresh_token: refToken }
            );
            AppStorage.set(TOKEN, refreshRes.access_token);
            AppStorage.set(REF_TOKEN, refreshRes.refresh_token);
            // 用新token重试
            return doStream(refreshRes.access_token);
          } else {
            if (this.onNotAuthChange) this.onNotAuthChange();
            uni.showToast({ title: '登录超时', icon: 'none', duration: 2000 });
            uni.redirectTo({ url: '/pages/index/index' });
            return;
          }
        }
        // 获取SSE流的ReadableStream reader
        const reader = resp.body?.getReader();
        if (!reader) throw new Error('无法获取 SSE 流 reader');
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            await reader.cancel();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            let jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            // 只去除头尾的BOM和零宽空格，保留内容体内的markdown换行等
            jsonStr = jsonStr.replace(/^[\uFEFF\u200B]+|[\uFEFF\u200B]+$/g, '');
            try {
              const data = JSON.parse(jsonStr);
              if (data.event === 'workflow_started' && getWorkflowInfo) {
                const options: Record<string, string> = {
                  conversation_id: data.conversation_id,
                  message_id: data.message_id,
                  created_at: data.created_at,
                  task_id: data.task_id,
                };
                getWorkflowInfo(options);
              }
              if (data.event === 'workflow_finished' && onDone) {
                onDone?.();
                await reader.cancel();
                return;
              }
              if (data.event === 'message' && typeof data.answer === 'string') {
                onChar?.(data.answer, data.message_id);
                await this.delayChar();
              }
            } catch (e) {
              console.warn('JSON 解析失败:', jsonStr, '长度:', jsonStr.length, 'charCodes:', jsonStr.split('').map(c => c.charCodeAt(0)));
            }
          }
        }
        onDone?.();
      } catch (err) {
        console.error('SSE 流异常:', err);
      }
    };
    await doStream();
  }
  
  /**
   * 延迟函数（用于控制字符输出速度）
   * @param ms 延迟毫秒数（默认30ms）
   */
  delayChar(ms = 30) {
  	return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

export const $ = new Request()
