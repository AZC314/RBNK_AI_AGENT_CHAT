<template>
	<view class="chat-container">
		<view class="chat-content">
			<z-paging ref="zPagingRef" v-model="msgList" :scroll-to="scrollTo" @query="loadMoreMessages" @refresh="onRefresh" :auto="false"
				:auto-show-back-to-top="false" :to-top-disabled="true" :show-loading-more-when-no-more="true"
				:refresher-enabled="true" :refresher-threshold="80" :refresher-default-style="'black'"
				:refresher-background="'#f5f5f5'" :loading-more-enabled="false" :empty-view-text="'暂无消息'"
				:empty-view-img="''" :auto-scroll-to-top-when-reload="false"
				:auto-hide-loading-after-first-loaded="true" :show-refresher-update-time="false"
				:refresher-update-time-key="'chat'" :refresher-complete-delay="200" :refresher-complete-duration="300"
				:refresher-end-bounce-enabled="true" :refresher-fps="40" :refresher-pull-rate="0.75"
				:refresher-out-rate="0.65" :chat-mode="true">
				<template #top>
					<uni-nav-bar :fixed="true" color="#091020" background-color="#fff" :border="false" height="60px"
						left-width="100%">
						<template #left>
							<view class="nav-left-group">
								<view class="back-btn-bg" @click="back">
									<image src="/static/icons/back.png" class="back-btn-img" />
								</view>
								<view class="avatar-box">
									<view class="avatar-wrap">
										<image :src="avatar" class="avatar-img" mode="aspectFill" />
									</view>
								</view>
								<view class="user-info">
									<view class="user-name">{{ AppStorage.get(CURRENT_ANENT_INFO).username }}</view>
									<view class="user-desc">{{ AppStorage.get(CURRENT_ANENT_INFO).departmentName }}
									</view>
								</view>
							</view>
						</template>
					</uni-nav-bar>
				</template>

				<!-- 消息列表 -->
				<view v-for="msg in msgList" :key="msg.msg.id">
					<kit-chat-system-msg v-if="msg.type === 'system'" :msg="msg.msg" />
					<kit-chat-my-msg v-else-if="msg.type === 'user' && msg.isSelf(myInfo.id ?? '000')" :msg="msg.msg"
						@favour_clinck="handleMessageClick" />
					<kit-chat-other-msg v-else :msg="msg.msg" @click="handleMessageClick" @feedback="handleFeedback"
						@like="handleLike" @dislike="handleDislike" @undislike="handleUndislike"
						@unlike="handleUnlike" />
				</view>
				<!-- 占位，防止被底部输入区遮挡，高度与chat-input一致，仅输入区显示时才显示 -->
				<view v-if="!popupVisible" style="height: 80px，background: #000;; flex-shrink: 0;"></view>
				<template #bottom>
					<uni-popup ref="popupRef" type="bottom" @close="closePopup" @maskClick="closePopup">
						<view class="feedback-popup-content">
							<view class="popup-header">
								<text class="popup-title">反馈</text>
								<text class="popup-close" @click="closePopup">×</text>
							</view>
							<view class="popup-tags">
								<view v-for="(tag, idx) in feedbackTags" :key="tag"
									:class="['popup-tag', selectedTag === idx ? 'active' : '']" @click="selectTag(idx)">
									{{ tag }}
								</view>
							</view>
							<view class="popup-textarea-wrapper">
								<textarea v-model="feedbackText" class="popup-textarea"
									:placeholder="textareaPlaceholder" auto-height />
							</view>
							<button class="popup-submit" @click="submitFeedback">提交</button>
						</view>
					</uni-popup>
					<chat-input v-if="!popupVisible" @send="handleSend" @stopChat="handleStopChat"
						:canStopChat="canStopChat" @image-upload="handleImageUpload"
						@attachment-upload="handleAttachmentUpload" @voice-record="handleVoiceRecord"
						@toggle-settings="handleToggleSettings" @clear="handleClear" />
				</template>
			</z-paging>
		</view>
	</view>
</template>

<script lang="ts" setup>
	// ====== 依赖与工具 ======
	import {
		Ref, ref,
		onMounted, onBeforeUnmount, watch, provide, reactive, nextTick
	} from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import ChatInput from '@/pages/chat/kit/chatInput.vue'
	import ChatMessage, { InnerMessage, MessageContent, UserInfo } from '@/models/ChatMessage'
	import { GET_PHOTO, DELETE_CONVERSATIONS, GET_CHAT_HISTORY, GET_MESSAGE, POST_CHAT_COMPLETIONS, POST_CHAT_STOP, POST_MESSAGE_FEEDBACK } from '@/api/api'
	import { Info } from '@/models/INFO'
	import { useChatSessionStore } from '@/stores/useChatSessionStore'
	import { useMessageStore } from '@/stores/useMessageStore'
	import { AppStorage } from '@/stores/AppStorage'
	import { CONVERSATIONID, CURRENT_ANENT_INFO } from '@/constances/constances'
	import { useAvatarStore } from '@/stores/useAvatarStore'
	import kitChatSystemMsg from '@/pages/chat/kit/kit-chat-system-msg.vue'
	import kitChatMyMsg from '@/pages/chat/kit/kit-chat-my-msg.vue'
	import kitChatOtherMsg from '@/pages/chat/kit/kit-chat-other-msg.vue'

	// 声明全局类型
	declare const uni : any
	const sessionStore = useChatSessionStore()
	const messageStore = useMessageStore()
	const avatarStore = useAvatarStore()

	// ====== 业务核心变量 ======
	let chatId = '' // 当前会话ID
	const chatTitle : Ref<string> = ref('') // 当前会话标题
	let conversationId = '' // 当前会话的conversationId
	const avatar : Ref<string> = ref('') // 当前会话头像
	const msgList : Ref<ChatMessage[]> = ref([]) // 聊天消息列表
	const scrollTo : Ref<string> = ref('bottom') // 控制消息区滚动定位（'top'/'bottom'）
	const canStopChat : Ref<boolean> = ref(false) // 是否可中断流式回复
	//流式回答的内容当前消息编号
	let messageId = ''
	let taskId = ''
	// 音频播放相关
	let audioContext : any = null
	let playingVoice = ''

	// ====== 类型定义 ======
	interface ChatResponse {
		items : any[];
		[key : string] : any;
	}

	interface MessageResponse {
		id : string;
		type : string;
		content : any;
		userinfo : UserInfo;
		time : Date;
		conversation_id : string;
	}

	/**
	 * 返回按钮，返回上一页
	 */
	function back() {
		uni.navigateBack()
	}

	/**
	 * 初始化加载本地和远程消息
	 */
	async function init() {
		try {
			// 先加载本地数据
			await messageStore.loadMessages(chatId);

			// 获取本地消息列表
			const localMessages = messageStore.getMessages(chatId);

			// 检查是否有本地数据
			if (localMessages.length > 0) {
				// 获取最后一条消息的时间
				const lastMessage = localMessages[localMessages.length - 1];
				const lastUpdateTime = new Date(lastMessage.created_at).getTime();
				const currentTime = Date.now();

				// 如果最后更新时间在1分钟内，直接使用本地数据
				if (currentTime - lastUpdateTime <= 60 * 1000) {
					handleMsgList(localMessages);
					// 滚动到底部显示最新消息
					await nextTick()
					setTimeout(() => {
						if (zPagingRef.value) {
							zPagingRef.value.scrollToBottom()
						}
					}, 100)
					return;
				}
			}

			if (conversationId !== '') {
				// 如果没有本地数据或数据超过1分钟，从服务器加载新数据
				const res = await GET_MESSAGE({
					conversation_id: conversationId,
					limit: 10
				});

				console.log('GET_MESSAGE success ' + JSON.stringify(res));
				const data = res as Info.message[];
				// 删除旧数据并添加新数据
				await messageStore.deleteMessages(chatId);
				data.map(elem => messageStore.addMessage(chatId, elem));
				handleMsgList(data);

				// 滚动到底部显示最新消息
				await nextTick()
				setTimeout(() => {
					if (zPagingRef.value) {
						zPagingRef.value.scrollToBottom()
					}
				}, 100)
			}
		} catch (err) {
			console.log('GET_MESSAGE fail ' + JSON.stringify(err));
		}
	}

	/**
	 * 加载头像
	 */
	async function loadAvatar() {
		avatar.value = await avatarStore.getAvatarUrl(AppStorage.get(CURRENT_ANENT_INFO).agentId, AppStorage.get(CURRENT_ANENT_INFO).face);
	}

	// 页面参数初始化
	onLoad((options) => {
		if (options?.agent_id) {
			chatId = decodeURIComponent(options.agent_id)
		}
		if (options?.conversationId) {
			conversationId = decodeURIComponent(options.conversationId)
		}
		const info = AppStorage.get(CURRENT_ANENT_INFO) as UserInfo
		chatTitle.value = info.username!;

		// 初始化消息并滚动到底部
		init()
	})

	// 页面挂载时初始化
	onMounted(async () => {
		messageId = String(Date.now() * Math.random() | 0)
		await loadAvatar()

		// 等待init完成，然后通知z-paging
		let retryCount = 0
		const maxRetries = 50 // 最多等待5秒

		const checkInitComplete = () => {
			if (msgList.value.length > 0) {
				// init已完成，通知z-paging
				nextTick(() => {
					if (zPagingRef.value) {
						zPagingRef.value.complete(msgList.value)
						zPagingRef.value.scrollToBottom()
					}
				})
			} else if (retryCount < maxRetries) {
				// 继续等待
				retryCount++
				setTimeout(checkInitComplete, 100)
			} else {
				// 超时，通知z-paging当前状态
				console.warn('初始化超时，使用当前状态')
				nextTick(() => {
					if (zPagingRef.value) {
						zPagingRef.value.complete(msgList.value)
					}
				})
			}
		}

		// 开始检查
		setTimeout(checkInitComplete, 100)
	})

	// 页面卸载时清理本地存储
	onBeforeUnmount(() => {
		AppStorage.delete(CONVERSATIONID)
		AppStorage.delete('textIDList')
		// 清理音频上下文
		if (audioContext) {
			audioContext.stop()
			audioContext.destroy()
			audioContext = null
		}
		playingVoice = ''
	})

	/**
	 * 格式化并插入消息到msgList
	 */
	function handleMsgList(pramas : Info.message[]) {
		pramas.map(elem => {
			const format = ChatMessage.ChatHistory2ChatMessage(elem, 'text', { agentId: chatId, username: chatTitle.value })
			msgList.value.push(...format)
		})
	}

	/**
	 * 发送消息
	 * @param message 用户输入的消息内容
	 */
	const handleSend = async (message : string) => {
		try {
			const myInfo = AppStorage.get('userInfo') as Info.User;
			const otherInfo = AppStorage.get(CURRENT_ANENT_INFO) as UserInfo;

			// 添加用户消息
			msgList.value.push(new ChatMessage({
				type: 'user',
				msg: {
					id: Date.now().toString(),
					type: 'text',
					content: {
						text: message
					},
					userinfo: {
						uid: myInfo.id.toString(),
						face: myInfo.avatar,
						username: myInfo.username
					},
					time: new Date(),
					conversation_id: conversationId
				}
			}));
			//todo强制到底
			nextTick(() => {
				scrollTo.value = 'bottom';
				if (zPagingRef.value && typeof zPagingRef.value.scrollToBottom === 'function') {
					zPagingRef.value.scrollToBottom();
				}
				setTimeout(() => {
					scrollTo.value = 'bottom';
					if (zPagingRef.value && typeof zPagingRef.value.scrollToBottom === 'function') {
						zPagingRef.value.scrollToBottom();
					}
				}, 50);
			});

			canStopChat.value = true;

			const params : any = {
				query: message,
				inputs: {
					agent_id: Number(chatId),
					is_think: "N"
				},
				response_mode: 'streaming',
				auto_generate_name: true
			};
			if (conversationId !== '') {
				params['conversation_id'] = conversationId;
			}

			// 流式回复相关回调
			const getWorkflowInfo = (params : Record<string, string>) => {
				console.log('POST_CHAT_COMPLETIONS getWorkflowInfo', params);
				taskId = params['task_id'];
				conversationId = params['conversation_id']
			}

			const onChar = (char : string, msgId : string) => {
				// console.log('Received char:', char);
				const existingStreamMsg = msgList.value.find(msg => msg.msg.id === messageId);

				if (existingStreamMsg) {
					existingStreamMsg.msg.content.text += char;
					if (msgId !== existingStreamMsg.msg.id) {
						existingStreamMsg.msg.id = msgId;
						messageId = msgId;
					}
					//todo强制到底
					nextTick(() => {
						scrollTo.value = 'bottom';
						if (zPagingRef.value && typeof zPagingRef.value.scrollToBottom === 'function') {
							zPagingRef.value.scrollToBottom();
						}
						setTimeout(() => {
							scrollTo.value = 'bottom';
							if (zPagingRef.value && typeof zPagingRef.value.scrollToBottom === 'function') {
								zPagingRef.value.scrollToBottom();
							}
						}, 50);
					});
				} else {
					msgList.value.push(new ChatMessage({
						type: 'user',
						msg: {
							id: messageId,
							type: 'markdown',
							content: { text: char },
							userinfo: otherInfo,
							time: new Date(),
							conversation_id: conversationId
						}
					}));
				}
			};

			const onDone = async () => {
				try {
					canStopChat.value = false;
					messageId = String(Date.now() * Math.random() | 0);

					// 更新会话历史
					const historyResponse = await GET_CHAT_HISTORY({
						agent_id: chatId,
						page: 1,
						page_size: 1,
						sort_by: '-updated_at'
					}) as ChatResponse;
					const successfully = sessionStore.addOrUpdateSession(historyResponse.items[0] as Info.ChatHistory)
					if (successfully) {
						const messageResponse = await GET_MESSAGE({
							conversation_id: conversationId,
							limit: 1
						}) as MessageResponse[];

						if (messageResponse.length === 1) {
							messageStore.addMessage(chatId, messageResponse[0]);
						}
					}
				} catch (error) {
					console.error('Error in onDone:', error);
					uni.showToast({
						title: '更新消息失败',
						icon: 'error',
						duration: 2000
					});
				}
			};

			await POST_CHAT_COMPLETIONS(params, undefined, getWorkflowInfo, onChar, onDone);
		} catch (error) {
			console.error('Error in handleSend:', error);
			uni.showToast({
				title: '发送消息失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	const handleStopChat = async () => {
		if (!canStopChat.value) return;

		try {
			const response = await POST_CHAT_STOP({
				conversation_id: conversationId,
				task_id: taskId
			});

			console.log('Chat stopped successfully:', response);
			canStopChat.value = false;
		} catch (error) {
			console.error('Error stopping chat:', error);
			uni.showToast({
				title: '停止聊天失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	const setIconClickEvent = () => {
		console.log('chat点击右上角设置按钮')
	}

	// 播放语音
	function playVoice(msg : { id : string }) {
		console.log('播放语音', msg)
		messageId = msg.id
	}

	// 显示图片
	function showPic(info : { url : string }) {
		console.log('显示图片', info)
		uni.previewImage({
			urls: [info.url]
		})
	}

	// 下拉刷新处理函数
	const onRefresh = async () => {
		try {
			// 如果没有conversationId，说明是新会话，直接完成刷新
			if (!conversationId) {
				zPagingRef.value.complete(msgList.value)
				return
			}

			// 获取当前会话的消息列表
			const currentMessages = messageStore.getMessages(chatId) || []
			const firstMsg = currentMessages[0]
			const first_id = firstMsg ? firstMsg.message_id || firstMsg.id : undefined

			const params : any = {
				conversation_id: conversationId,
				limit: 10
			}
			if (first_id) params.first_id = first_id

			const res = await GET_MESSAGE(params)
			const data = res as Info.message[]

			if (data && data.length > 0) {
				// 有新数据，添加到列表前面
				await messageStore.unshiftAddMessage(chatId, data)
				const newMessages = data.map(msg => ChatMessage.ChatHistory2ChatMessage(msg, 'text', { agentId: chatId, username: chatTitle.value })).flat()
				msgList.value = [...newMessages, ...msgList.value]
				// 告知z-paging下拉刷新结束，传入完整的消息列表
				zPagingRef.value.complete(msgList.value)
			} else {
				// 没有更多历史数据，标记为没有更多数据
				zPagingRef.value.complete(msgList.value, 'noMore')
			}
		} catch (error) {
			console.error('下拉刷新失败:', error)
			// 告知z-paging下拉刷新失败
			zPagingRef.value.complete(msgList.value, 'fail')
		}
	}

	// 处理图片上传
	const handleImageUpload = async (file : File) => {
		try {
			// TODO: 实现图片上传逻辑
			console.log('处理图片上传:', file);
			uni.showToast({
				title: '图片上传功能开发中',
				icon: 'none',
				duration: 2000
			});
		} catch (error) {
			console.error('图片上传失败:', error);
			uni.showToast({
				title: '图片上传失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	// 处理附件上传
	const handleAttachmentUpload = async (file : File) => {
		try {
			// TODO: 实现附件上传逻辑
			console.log('处理附件上传:', file);
			uni.showToast({
				title: '附件上传功能开发中',
				icon: 'none',
				duration: 2000
			});
		} catch (error) {
			console.error('附件上传失败:', error);
			uni.showToast({
				title: '附件上传失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	// 处理语音录制
	const handleVoiceRecord = async (audioBlob : Blob) => {
		try {
			// TODO: 实现语音录制逻辑
			console.log('处理语音录制:', audioBlob);
			uni.showToast({
				title: '语音录制功能开发中',
				icon: 'none',
				duration: 2000
			});
		} catch (error) {
			console.error('语音录制失败:', error);
			uni.showToast({
				title: '语音录制失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	// 处理设置切换
	const handleToggleSettings = () => {
		try {
			console.log('切换设置面板');
			// TODO: 实现设置面板切换逻辑
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none',
				duration: 2000
			});
		} catch (error) {
			console.error('切换设置失败:', error);
			uni.showToast({
				title: '切换设置失败',
				icon: 'error',
				duration: 2000
			});
		}
	};

	// 处理清空输入
	const handleClear = () => {
		try {
			if (msgList.value.length < 1) {
				return
			}
			uni.showModal({
				title: '清除对话消息',
				content: '对话消息清除后将失去以往记忆，确定清除吗？',
				confirmText: '清除',
				confirmColor: '#1890ff',
				success: function (res) {
					if (res.confirm) {

						sessionStore.saveToStorage()
						DELETE_CONVERSATIONS(conversationId).then(res => {
							sessionStore.removeSession(chatId);
							messageStore.deleteMessages(chatId);
							msgList.value = []
							console.log('清除成功');
						}).catch(err => {
							console.log('清除失败' + JSON.stringify(err));
						})
					}
				}
			})
		} catch (error) {
			console.error('清空输入失败:', error);
		}
	};

	const popupRef = ref(null)
	const currentFeedbackMsg = ref(null)
	const feedbackTags = ['有害/不安全', '虚假信息', '没有帮助', '其他']
	const selectedTag = ref(0)
	const feedbackText = ref('')
	const textareaPlaceholder = '我们想知道你对此回答不满意的原因，你认为更好的回答是什么？'
	const popupVisible = ref(false)
	const feedbackMap = reactive(new Map()) // key: msg.id, value: {dislike: boolean, like: boolean}
	provide('feedbackMap', feedbackMap)
	function onFeedback(msg) {
		currentFeedbackMsg.value = msg
		popupVisible.value = true
		popupRef.value && popupRef.value.open()
	}
	function selectTag(idx) {
		selectedTag.value = idx
	}
	function closePopup() {
		messageId = String(Date.now() * Math.random() | 0)
		popupVisible.value = false
		popupRef.value && popupRef.value.close()
	}
	function submitFeedback() {
		try {
			POST_MESSAGE_FEEDBACK({
				conversation_id: conversationId,
				message_id: messageId,
				rating: "dislike",
				content: feedbackText.value
			}).then(res => {
				console.log('POST_MESSAGE_FEEDBACK dislike succes ' + JSON.stringify(res));
			}).then(err => {
				console.log(err);
			})
			if (currentFeedbackMsg.value) {
				feedbackMap.set(currentFeedbackMsg.value.id, { dislike: true, like: false })
			}
			uni.showToast({ title: '感谢您的反馈', icon: 'none' })
			closePopup()
			feedbackText.value = ''
			selectedTag.value = 0
		} catch (error) {
			console.log('submitFeedback fail' + error);
		}
	}
	function onLike(msg : InnerMessage) {
		try {
			POST_MESSAGE_FEEDBACK({
				conversation_id: msg.conversation_id,
				message_id: msg.id,
				rating: "like",
				content: ""
			}).then((res) => {
				console.log('POST_MESSAGE_FEEDBACK like success' + JSON.stringify(res));
			})
				.catch((err) => {
					console.log('POST_MESSAGE_FEEDBACK fail' + err);
				})
		} catch (error) {
			//TODO handle the exception
			console.log('POST_MESSAGE_FEEDBACK fail' + error);
		}
	}
	function onDislike(msg : InnerMessage) {
		onFeedback(msg)
		messageId = msg.id;
	}
	function onUndislike(msg : InnerMessage) {
		// 预留处理位置
		console.log('用户取消了不喜欢', msg)
	}
	function onUnlike(msg : InnerMessage) {
		// 预留处理位置
		console.log('用户取消了喜欢', msg)
	}

	// 嵌入z-paging相关逻辑
	const zPagingRef = ref()
	const myInfo = AppStorage.get('userInfo') as Info.User;
	watch(msgList, (val) => {
		// pagingList.value = val
	}, { immediate: true, deep: true })
	watch(scrollTo, async (val) => {
		await nextTick()
		if (zPagingRef.value) {
			if (val === 'top') {
				zPagingRef.value.scrollToTop()
			} else if (val === 'bottom') {
				zPagingRef.value.scrollToBottom()
			}
		}
	})
	const loadMoreMessages = () => {
		onRefresh()
	}

	// 统一处理消息点击（图片、语音、文件、视频等）
	const handleMessageClick = (type : string, content : any) => {
		switch (type) {
			case 'img':
				uni.previewImage({ urls: [content.url], current: content.url })
				break
			case 'voice':
				if (audioContext && playingVoice === content.voiceUrl) {
					audioContext.stop()
					playingVoice = ''
				} else {
					if (audioContext) audioContext.stop()
					audioContext = uni.createInnerAudioContext()
					audioContext.src = content.voiceUrl
					audioContext.play()
					playingVoice = content.voiceUrl
					audioContext.onEnded(() => { playingVoice = '' })
				}
				break
			case 'file':
				uni.downloadFile({
					url: content.fileUrl,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.openDocument({ filePath: res.tempFilePath })
						}
					}
				})
				break
			case 'video':
				uni.navigateTo({
					url: `/pages/video-player/video-player?url=${encodeURIComponent(content.videoUrl)}`
				})
				break
			default:
				console.log('消息点击', type, content)
		}
	}

	// 消息反馈相关事件处理
	const handleFeedback = (msg : InnerMessage) => {
		onFeedback(msg)
	}

	const handleLike = (msg : InnerMessage) => {
		onLike(msg)
	}

	const handleDislike = (msg : InnerMessage) => {
		onDislike(msg)
	}

	const handleUndislike = (msg : InnerMessage) => {
		onUndislike(msg)
	}

	const handleUnlike = (msg : InnerMessage) => {
		onUnlike(msg)
	}
</script>


<style scoped lang="scss">
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;

		.leftcontext {
			display: flex;
			align-items: center;
			gap: 6rpx;
		}
	}

	.chat-content {
		flex: 1;
		background-color: #f5f5f5;
		padding-top: 10rpx;
	}

	.feedback-popup-content {
		height: 33vh;
		background: #fff;
		border-top-left-radius: 24rpx;
		border-top-right-radius: 24rpx;
		box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32rpx 32rpx 0 32rpx;
		position: relative;
	}

	.popup-header {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		margin-bottom: 24rpx;
	}

	.popup-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #222;
	}

	.popup-close {
		position: absolute;
		right: 0;
		top: 0;
		font-size: 44rpx;
		color: #999;
		padding: 0 8rpx;
		cursor: pointer;
		line-height: 1;
	}

	.popup-tags {
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 20rpx;
		margin-bottom: 32rpx;
		justify-content: flex-start;
	}

	.popup-tag {
		background: #f6f7fa;
		color: #666;
		border-radius: 12rpx;
		padding: 12rpx 12rpx;
		font-size: 28rpx;
		margin-right: 0;
		transition: background 0.2s, color 0.2s;
		white-space: nowrap;
	}

	.popup-tag.active {
		background: #e6f0ff;
		color: #007aff;
	}

	.popup-textarea-wrapper {
		width: 100%;
		margin-bottom: 32rpx;
	}

	.popup-textarea {
		width: 100%;
		min-height: 120rpx;
		background: #f6f7fa;
		border-radius: 16rpx;
		border: none;
		font-size: 28rpx;
		color: #666;
		padding: 24rpx;
		box-sizing: border-box;
		resize: none;
	}

	.popup-submit {
		width: 100%;
		height: 88rpx;
		background: #1677ff;
		color: #fff;
		font-size: 32rpx;
		border-radius: 16rpx;
		border: none;
		margin-top: auto;
		margin-bottom: 24rpx;
		font-weight: 600;
	}

	.avatar-wrap {
		display: flex;
		align-items: center;
		margin-left: 8px;
	}

	.avatar-img {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		background: #388bff;
	}

	.avatar-circle {
		width: 40px;
		height: 40px;
		background: #388bff;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22px;
		font-weight: bold;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-left: 8px;
	}

	.user-name {
		font-size: 16px;
		font-weight: bold;
		color: #222;
	}

	.user-desc {
		font-size: 13px;
		color: #999;
		margin-top: 2px;
	}

	.nav-left-group {
		display: flex;
		align-items: center;
	}

	.back-btn-bg {
		width: 32px;
		height: 32px;
		background: #f7f8f9;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12rpx;
		margin-left: 4rpx;
		cursor: pointer;
	}

	.back-btn-img {
		width: 18px;
		height: 18px;
	}
</style>