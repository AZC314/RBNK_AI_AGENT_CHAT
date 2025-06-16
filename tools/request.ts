

export enum HttpStatus {
	SUCCESS = 200, // 请求成功
	NO_AUTH = 401, // token失效
	NOT_FOUND = 404, // 请求资源不存在
}
/**
 * 接口环境类型：
 * DEVELOPER：研发接口
 * TEST：测试接口
 * PRODUCT：上线接口
 */
interface EnvType {
	DEVELOPER ?: string,
	TEST ?: string,
	PRODUCT ?: string,
}

/**
 * 配置文件类型：
 * EnvBase：接口地址
 * Host：主机地址
 * Header：请求头
 * NotAuthPage：未响应跳转页面
 */
interface ConfigType {
	EnvBase ?: EnvType,
	Host ?: string,
	Header ?: Function,
	NotAuthPage ?: string
}

class Request {
	/**
	 * 配置对象：可设置环境基地址、请求头、token
	 */
	public config : ConfigType = {}
	private WhiteList : string[] = []
	public onNotAuthChange ?: Function
	static instance : Request | undefined;
	/**
	  * 设置白名单
	  * @param api
	  */
	setWhiteList(apis : string[]) {
		this.WhiteList = apis
	}

	private isWhiteList(api : string) {
		return this.WhiteList.some(item => api.includes(item))
	}

	private getHeader(api : string, customHeader ?: object) {
		if (this.isWhiteList(api)) {
			return { 'Content-Type': 'application/json' }
		}
		if (customHeader) return customHeader;
		if (this.config.Header) {
			return this.config.Header()
		}
		return undefined
	}

	async request(api : string, method : 'GET' | 'POST' | 'DELETE', data ?: object, header ?: object) {
		const url = this.config.Host + api
		const reqHeader = this.getHeader(api, header)

		return new Promise((resolve, reject) => {
			uni.request({
				url,
				method,
				data,
				header: reqHeader,
				success: (res) => {
					if (res.statusCode === HttpStatus.SUCCESS) {
						resolve(res.data)
					}
					if (res.statusCode === HttpStatus.NO_AUTH) {
						if (this.onNotAuthChange) this.onNotAuthChange()
						// todo
						uni.showToast({
							title: '登录超时',
							icon: 'none',
							duration: 2000
						})
						uni.redirectTo({
							url: '/pages/index/index'
						})
					}
					reject(res)
				},
				fail: (err) => {
					reject(err)
				},
			})
		}) as object
	}

	get(api : string, params ?: object, header ?: object) {
		return this.request(api, 'GET', params, header)
	}

	post(api : string, params ?: object, header ?: object) {
		return this.request(api, 'POST', params, header)
	}

	delete(api : string, params ?: object, header ?: object) {
		// 如果传了 params，就拼接成查询字符串
		const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
		return this.request(api + queryString, 'DELETE', undefined, header)
	}
}

export const $ = new Request()