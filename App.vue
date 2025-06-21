<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			globalInitialization()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
	function globalInitialization() {
		console.log('执行全局初始化');
	}
</script>

<style>
	/*每个页面公共css */
</style>