import { defineStore } from 'pinia'
import { reactive } from 'vue'

const HOST = 'http://14.103.131.43:15000'

export const useAvatarStore = defineStore('avatarStore', () => {
	const cache = reactive(new Map<string, string>())

	/**
	 * 根据用户 ID 和头像路径返回完整头像 URL
	 */
	async function getAvatarUrl(key: string, path?: string): Promise<string> {
		if (!path || path=== '') {
			return '/static/default-avatar.png';
		}
	
		if (cache.has(key)) {
			return cache.get(key)!;
		}
	
		const url = HOST.endsWith('/') ? HOST + path.replace(/^\//, '') : HOST + '/' + path.replace(/^\//, '');
		const response = await fetch(url);
		const blob = await response.blob();
		const blobUrl = URL.createObjectURL(blob);
		cache.set(key, blobUrl);
		return blobUrl;
	}

	/**
	 * 手动更新头像缓存
	 */
	function setAvatarUrl(key : string, fullUrl : string) {
		cache.set(key, fullUrl)
	}

	/**
	 * 清空缓存
	 */
	function clearCache() {
		cache.clear()
	}

	return {
		cache,
		getAvatarUrl,
		setAvatarUrl,
		clearCache,
	}
})