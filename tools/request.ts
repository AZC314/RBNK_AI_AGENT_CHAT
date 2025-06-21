import {AppStorage} from '@/stores/AppStorage'
import {TOKEN,REF_TOKEN } from '@/constances/constances'

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
          header: this.getHeader(api, header),
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
}

export const $ = new Request()
