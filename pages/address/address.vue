<template>
	<uni-nav-bar color="#091020" background-color="#FFF" fixed="true" leftText="通讯录" :border="false"
		class="navbar"></uni-nav-bar>
	<view class="searchBox">
		<uni-search-bar v-model="searchText" placeholder="搜索联系人" radius="10" cancelButton="none" bgColor="#f7f7f9" />
	</view>
	<link-man-list-view :list="filteredList" />
</template>

<script setup lang="ts">
	import {
		ref,
		onMounted,
		computed
	} from 'vue'
	import SearchBox from '@/components/searchBox.vue'
	import LinkManListView from '@/components/linkManListView.vue'
	import PinyinMatch from 'pinyin-match'
	import { LinkManModel } from '@/models/LinkManModel'
	import { GET_AVAILABLE, GET_DIGITAL_HUMANS } from '@/api/api'
	import { Info } from '@/models/INFO'
	import { AppStorage } from '@/stores/AppStorage'

	// 搜索框内容
	const searchText = ref('')


	// 通讯录数据
	const contacts = ref<LinkManModel[]>([])

	/* const groupedContacts = computed(() => {
		const groups : Record<string, LinkManModel[]> = {}

		contacts.value.forEach(contact => {
			const dept = contact.department?.trim() || '未分组'
			if (!groups[dept]) {
				groups[dept] = []
			}
			groups[dept].push(contact)
		})

		return groups
	}) */


	function handleLinkManList(pararms : object) {
		GET_AVAILABLE(pararms).then((res) => {
			console.log('GET_AVAILABLE Sessaces ' + JSON.stringify(res));
			if (res) {
				HandledigitalHumans(res as Info.digitalHumansContext)
			}
		})
	}
	function HandledigitalHumans(orginalContext : Info.digitalHumansContext) {

		//总页数
		let total_pages = orginalContext.total_pages;
		//当前页数
		let page = orginalContext.page;
		const orginalList = AppStorage.get('contacts') as LinkManModel[]
		let newList = orginalContext.data.map((value : Info.digitalHumans) => {
			return LinkManModel.digitalHumans2LinkManModel(value)
		})
		AppStorage.set('contacts', [...orginalList, ...newList])

		console.log('linkManLIst ' + orginalList.length + newList.length + 'total_pages' + total_pages + "page" + page);
		if (page >= total_pages) {
			console.log('最终的contacts(LinkManList)' + JSON.stringify(AppStorage.get('contacts')));
			contacts.value = AppStorage.get('contacts')
		} else {
			handleLinkManList(new Object({ page_size: orginalContext.page_size, page: page + 1, sort_by: '-updated_at' ,is_digital_human:true}))
		}
	}
	onMounted(() => {
		const data = AppStorage.get('contacts') as []
		if(data.length > 0){
			contacts.value = AppStorage.get('contacts')
		}else{
			handleLinkManList(new Object({ page_size: 100 ,is_digital_human:true}))
		}
		


		// // 按部门和姓名排序
		// contacts.value = contactList.sort((a, b) => {
		// 	if (a.department !== b.department) {
		// 		return a.department.localeCompare(b.department)
		// 	}
		// 	return a.name.localeCompare(b.name)
		// })
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
	::v-deep(.uni-navbar-left) {
		font-size: 36rpx !important;
		font-weight: bold;
	}

	.searchBox {
		width: 96vw;
		padding: 10rpx 2vw;
		background-color: #fdfdfe;
	}

	image {
		width: 26rpx;
		height: 26rpx;
	}
</style>