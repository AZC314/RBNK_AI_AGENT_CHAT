<template>
	<uni-list-item class="linkman-item" @click="onItemClick" clickable>
		<template v-slot:header>
			<!-- 头像区域 -->
			<view class="avatar-container">
				<image :src="avatar" class="avatar" mode="aspectFill" />
				<!-- <view v-else class="avatar-placeholder">
					{{ getFirstChar(linkman.name) }}
				</view> -->
				<!-- 在线状态指示器 -->
				<!-- <view v-if="linkman.isOnline" class="online-indicator"></view> -->
			</view>
		</template>
		<template v-slot:body>
			<view class="content">
				<view class="name-row">
					<text class="name">{{ linkman.name }}&nbsp;</text>
				</view>
				<text class="department">{{ linkman.department }}</text>
			</view>
		</template>
		<template v-slot:footer>
			<view class="person-icon">
				<image src="@/static/icons/person.png" class="person" mode="aspectFill" />
			</view>
		</template>
	</uni-list-item>
</template>

<script lang="ts" setup>
	import {
		defineProps, ref
	} from 'vue'
	import { LinkManModel } from '@/models/LinkManModel'
	import { GET_PHOTO } from '@/api/api'
	import { useChatSessionStore } from '@/stores/useChatSessionStore'
	import { AppStorage } from '@/stores/AppStorage'
	import ChatMessage, { UserInfo } from '@/models/ChatMessage'
	import { CURRENT_ANENT_INFO } from '@/constances/constances'
	import { useAvatarStore } from '@/stores/useAvatarStore'
import { onMounted } from 'vue'

	const avatarStore = useAvatarStore()
	const sessionStore = useChatSessionStore()

	const props = defineProps<{
		linkman : LinkManModel
	}>()
	const avatar = ref('/static/default-avatar.png')

	async function loadAvatar() {
		const a = await avatarStore.getAvatarUrl(props.linkman.userId, props.linkman.avatarUrl)
		avatar.value = a;
	}

	function getFirstChar(name : string) {
		return name ? name.charAt(0).toUpperCase() : ''
	}

	const onItemClick = () => {
		console.log('linkmanListItem onclink');
		const agent_id = encodeURIComponent(props.linkman.userId ?? 'unKnow')
		const conversationId = () => {
			const session = sessionStore.getSessionByAgentId(+props.linkman.userId)
			return session ? session.conversation_id : ''
		}
		const currentAgentInfo : UserInfo = {
			agentId: props.linkman.userId,
			username: props.linkman.name,
			face: props.linkman.avatarUrl,
			departmentName: props.linkman.department,
			departmentId: props.linkman.departmentId
		}
		AppStorage.set(CURRENT_ANENT_INFO, currentAgentInfo)

		uni.navigateTo({
			url: `/pages/chat/chat?agent_id=${agent_id}&conversationId=${conversationId()}`
		})
	}
	
	onMounted(()=>{
		loadAvatar()
	})

</script>

<style scoped lang="scss">
.linkman-item {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s;
  &:last-child {
    border-bottom: none;
  }
  &:active {
    background: #f7f7f7;
  }
}

image {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.7;
}

.avatar-container {
  width: 88rpx;
  height: 88rpx;
  margin-right: 24rpx;
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2rpx solid #f1f3f4;
  box-shadow: none;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.online-indicator {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #52c41a;
  border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  min-width: 0;

  .name-row {
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;
    .name {
      font-size: 30rpx;
      color: #1a1a1a;
      font-weight: 600;
      line-height: 1.4;
      letter-spacing: 0.3rpx;
    }
  }
  .department {
    font-size: 26rpx;
    color: #6c757d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    font-weight: 400;
  }
}

.person-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  width: 48rpx;
  .person {
    width: 28rpx;
    height: 28rpx;
    opacity: 0.6;
    display: block;
    margin: 0 auto;
  }
}
</style>