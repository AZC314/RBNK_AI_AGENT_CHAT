import { useAvatarStore } from '@/stores/useAvatarStore'

export namespace GeneralServices {
	const avatarStore = useAvatarStore()
	
	
	export async function loadAvatar(id:string,url:string) {
		return await avatarStore.getAvatarUrl(id, url)
	}
	
	
	
}



export default GeneralServices;