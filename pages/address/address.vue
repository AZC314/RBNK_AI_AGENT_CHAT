<template>
	<uni-nav-bar color="#091020" background-color="#FFF" fixed="true" leftText="通讯录" :border="false"
		class="navbar"></uni-nav-bar>
	<view class="searchBox">
		<uni-search-bar v-model="searchText" placeholder="搜索联系人" radius="10" cancelButton="none" bgColor="#f7f7f9"
			:input-style="inputStyle" :placeholder-style="placeholderStyle" />
	</view>
	<link-man-list-view :list="filteredList" />
</template>

<script setup lang="ts">
	import {
		ref,
		onMounted,
		computed
	} from 'vue'
	import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
	import PinyinMatch from 'pinyin-match'
	import { AppStorage } from '@/stores/AppStorage'
	import GeneralServices from '@/api/GeneralServices'
	import { LinkManModel } from '@/models/LinkManModel'
	import LinkManListView from '@/pages/address/kit/linkManListView.vue'


	// 搜索框内容
	const searchText = ref('')
	// 通讯录数据
	const contacts = ref<LinkManModel[]>([])

	// 保证输入框聚焦和失焦样式一致
	const inputStyle = 'color:#222;font-size:28px;font-weight:400;background:#fff;';
	const placeholderStyle = 'color:#bbb;font-size:22px;';

	onMounted(() => {
		const data = AppStorage.get('contacts') as []
		if (data.length > 0) {
			contacts.value = AppStorage.get('contacts')
		} else {
			// 使用GeneralServices获取联系人列表，存储到contacts
			GeneralServices.handleLinkManList({ page_size: 100, is_digital_human: true }, (list : LinkManModel[]) => {
				contacts.value = list
				// @ts-ignore
				if (typeof uni !== 'undefined' && uni.stopPullDownRefresh) uni.stopPullDownRefresh()
			})
		}
	})

	// 接收页面参数
	onLoad(() => {


	})
	// 下拉刷新处理函数
	onPullDownRefresh(() => {
		try {
			// 清空现有数据
			AppStorage.set('contacts', [])
			contacts.value = []
			// 重新加载数据，使用GeneralServices
			GeneralServices.handleLinkManList({ page_size: 100, is_digital_human: true }, (list : LinkManModel[]) => {
				contacts.value = list
				// @ts-ignore
				if (typeof uni !== 'undefined' && uni.stopPullDownRefresh) uni.stopPullDownRefresh()
			})
		} catch (error) {
			console.error('下拉刷新失败:', error)
			// @ts-ignore
			if (typeof uni !== 'undefined' && uni.showToast) {
				uni.showToast({
					title: '刷新失败',
					icon: 'error',
					duration: 2000
				})
			}
			// @ts-ignore
			if (typeof uni !== 'undefined' && uni.stopPullDownRefresh) uni.stopPullDownRefresh()
		}
	})

	//过滤联系人列表
	// 安全的匹配函数，避免 null/undefined 报错
	const matchText = (text : string | undefined | null, keyword : string) : boolean =>
		PinyinMatch.match(text ?? '', keyword) as boolean

	// 支持拼音过滤
	const filteredList = computed(() => {
		const keyword = searchText.value.trim()
		if (!keyword) return contacts.value

		return contacts.value.filter(({ name, department }) =>
			matchText(name, keyword) || matchText(department, keyword)
		)
	})
</script>

<style lang="scss">
	/* 导航栏样式优化 */
	::v-deep(.uni-navbar-left) {
		font-size: 32rpx !important;
		font-weight: 600;
		color: #1a1a1a;
	}

	/* 搜索框容器样式优化 */
	.searchBox {
		width: 100%;
		padding: 16rpx 24rpx;
		background-color: #fdfdfe;
		border-bottom: 1rpx solid #e9ecef;
		box-sizing: border-box;
	}

	/* 图标样式优化 */
	image {
		width: 24rpx;
		height: 24rpx;
		opacity: 0.8;
	}
</style>