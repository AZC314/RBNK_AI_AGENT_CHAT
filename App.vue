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
			GeneralServices.globalInitialization()
		},
		onShow: function () {
			console.log('App Show', new Date().toLocaleString())
			const LastOnlineTime = AppStorage.get('LAST_ONLINE_TIME') ?? 1735660800000
			const diffTime = Date.now() - LastOnlineTime
			if (diffTime >= 1000 * 60 * 5) {
				GeneralServices.clearStore()
				GeneralServices.globalInitialization()
			}
		},
		onHide: function () {
			console.log('App Hide', new Date().toLocaleString())
			AppStorage.set('LAST_ONLINE_TIME', Date.now())
		}
	}
</script>

<style lang="scss">

</style>