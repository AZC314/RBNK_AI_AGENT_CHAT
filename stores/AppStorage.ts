// localStorage
export const AppStorage = {
	/**
	 * 获取字符串值
	 */
	get(key : string) : any {
		try {
			return uni.getStorageSync(key);
		} catch {
			return null;
		}
	},

	/**
	 * 设置字符串值
	 */
	set(key : string, value : any) : void {
		uni.setStorageSync(key, value)
	},

	/**
	 * 删除键
	 */
	delete(key : string) : void {
		uni.removeStorageSync(key)
	},

	/**
	 * 清空所有本地存储
	 */
	clear() : void {
		uni.clearStorageSync()
	}
}