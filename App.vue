<script lang="ts">
	import {
		AppStorage
	} from '@/stores/AppStorage'
	import GeneralServices from '@/api/GeneralServices'
	import {
		TOKEN,
		USER_INFO
	} from '@/constances/constances'
	import { Info } from '@/models/INFO'

	export default {
		onLaunch: function () {
			console.log('App Launch')
			GeneralServices.initStore()
			globalInitialization()
		},
		onShow: function () {
			console.log('App Show', new Date().toLocaleString())
			const LastOnlineTime = AppStorage.get('LAST_ONLINE_TIME') ?? 1735660800000
			const diffTime = Date.now() - LastOnlineTime
			if (diffTime >= 1000 * 60 * 5) { 
				GeneralServices.clearStore()
				globalInitialization
			}
		},
		onHide: function () {
			console.log('App Hide', new Date().toLocaleString())
			AppStorage.set('LAST_ONLINE_TIME', Date.now())
		}
	}

	function globalInitialization() {
		console.log('执行全局初始化');
		if (AppStorage.get(TOKEN)) {
			GeneralServices.handleMeInfo((userInfo) => {
				const userInfoByStorage = AppStorage.get(USER_INFO) as Info.User
				if (userInfoByStorage?.id !== userInfo.id) {
					GeneralServices.clearStore()
					AppStorage.set(USER_INFO, userInfo)
					GeneralServices.preHandleSessionList({ page_size: 10, page: 1, sort_by: '-updated_at' })
					GeneralServices.handleLinkManList({ page_size: 100, is_digital_human: true })
				}
			})
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>