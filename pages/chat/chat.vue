<template>
	<view class="chat-container">
		<uni-nav-bar :fixed="true" color="#091020" background-color="#FFF" :border="false" left-icon="left"
			:left-text="chatTitle" leftWidth='380px' @clickLeft="back">
			<!-- left-icon="left" @clickLeft="back" chatTitle-->
			<!-- <block v-slot:left>
				<view class="leftcontext">
					<uni-icons type="back" color="#091020" size="18" />
					<view>
						<text class="uni-nav-bar-text">{{ chatTitle }}</text>
					</view>

				</view> -->
			<!-- </block> -->
		</uni-nav-bar>
		<view class="chat-content">
			<!-- <chat-message-list :msgList="msgList" :currentUID="myUid" @refresh="onRefresh" />-->
			<chat-message-list :msgList="msgList" @refresh="onRefresh" />
		</view>
		<chat-input @send="handleSend" @stopChat="handleStopChat" :canStopChat="canStopChat"
			@image-upload="handleImageUpload" @attachment-upload="handleAttachmentUpload"
			@voice-record="handleVoiceRecord" @toggle-settings="handleToggleSettings" @clear="handleClear" />
	</view>
</template>

<script lang="ts" setup>
	import {
		Ref, ref,
		onMounted, onBeforeUnmount, watch
	} from 'vue'
	import chatMessageList from '@/components/kit-chat/chat-message-list.vue'
	import ChatInput from '@/components/kit-chat/chatInput.vue'
	import ChatMessage, { InnerMessage, MessageContent, UserInfo } from '@/models/ChatMessage'
	import { DELETE_CONVERSATIONS, GET_CHAT_HISTORY, GET_MESSAGE, POST_CHAT_COMPLETIONS, POST_CHAT_STOP } from '@/api/api'
	import { Info } from '@/models/INFO'
	import { useChatSessionStore } from '@/stores/useChatSessionStore'
	import { useMessageStore } from '@/stores/useMessageStore'
	import { SessionModel } from '@/models/sessionModel'
	import { AppStorage } from '@/stores/AppStorage'
	import { CONVERSATIONID, CURRENT_ANENT_INFO } from '@/constances/constances'

	// 声明全局类型
	declare const uni : any
	declare const getCurrentPages : () => any[]
	const sessionStore = useChatSessionStore()
	const messageStore = useMessageStore()

	let chatId = ''
	const chatTitle : Ref<string> = ref('')
	let conversationId = ''
	// const myUid : Ref<string> = ref('1')
	const playMsgid : Ref<string> = ref('2')
	const msgList : Ref<ChatMessage[]> = ref([])
	const scrollTop : Ref<number> = ref(0)
	const scrollToView : Ref<string> = ref('')
	const loading : Ref<boolean> = ref(false)
	const isRefreshing : Ref<boolean> = ref(false)
	const canStopChat : Ref<boolean> = ref(false)
	//流式回答的内容当前消息编号
	let currentTextID = ''
	let taskId = ''

	// 添加类型定义
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

	// 返回按钮
	function back() {
		uni.navigateBack()
	}

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
					return;
				}
			}
			
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
		} catch (err) {
			console.log('GET_MESSAGE fail ' + JSON.stringify(err));
		}
	}

	// H5 页面初始化（通过 getCurrentPages 获取传参）
	onMounted(() => {
		currentTextID = (Date.now() * Math.random() | 0).toString()
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		const options = currentPage.$page.options

		if (options.agent_id) {
			chatId = decodeURIComponent(options.agent_id)
		}
		if (options.agentName) {
			chatTitle.value = decodeURIComponent(options.agentName)
		}
		if (options.conversationId) {
			conversationId = decodeURIComponent(options.conversationId)
		}
		init();



		// msgList.value.push(
		// 	// markdown
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1001',
		// 			type: 'markdown',
		// 			content: {
		// 				text: '# Markdown 测试\n**粗体**\n- 项1\n- 项2\n[官网](https://uniapp.dcloud.io)'
		// 			},
		// 			userinfo: {
		// 				uid: '2',
		// 				username: '对方',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 10
		// 		}
		// 	}),
		// 	// chart（option方式）
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1002',
		// 			type: 'chart',
		// 			content: {
		// 				option: {
		// 					title: { text: '近7天访问量' },
		// 					tooltip: {},
		// 					xAxis: { data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
		// 					yAxis: {},
		// 					series: [{ type: 'line', data: [120, 132, 101, 134, 90, 230, 210] }]
		// 				}
		// 			},
		// 			userinfo: {
		// 				uid: '2',
		// 				username: '对方',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 9
		// 		}
		// 	}),
		// 	// img
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1003',
		// 			type: 'img',
		// 			content: {
		// 				url: '/static/female-model-9565629_1280.jpg',
		// 				w: 300,
		// 				h: 200
		// 			},
		// 			userinfo: {
		// 				uid: '1',
		// 				username: '我',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 8
		// 		}
		// 	}),
		// 	// file
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1004',
		// 			type: 'file',
		// 			content: {
		// 				fileName: '测试文档.docx',
		// 				fileSize: 204800,
		// 				fileUrl: '/static/test.pdf'
		// 			},
		// 			userinfo: {
		// 				uid: '2',
		// 				username: '对方',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 7
		// 		}
		// 	}),
		// 	// voice
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1005',
		// 			type: 'voice',
		// 			content: {
		// 				voiceUrl: '/static/voice.mp3',
		// 				duration: 5
		// 			},
		// 			userinfo: {
		// 				uid: '1',
		// 				username: '我',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 6
		// 		}
		// 	}),
		// 	// video
		// 	new ChatMessage({
		// 		type: 'user',
		// 		msg: {
		// 			id: 'msg_1006',
		// 			type: 'video',
		// 			content: {
		// 				videoUrl: '/static/video.mp4',
		// 				coverImage: '/static/图1.jfif',
		// 				duration: 60
		// 			},
		// 			userinfo: {
		// 				uid: '2',
		// 				username: '对方',
		// 				face: '/static/logo.png'
		// 			},
		// 			time: Date.now() - 1000 * 60 * 5
		// 		}
		// 	})
		// )
	})
	onBeforeUnmount(() => {
		AppStorage.delete(CONVERSATIONID)
	})

	function handleMsgList(pramas : Info.message[]) {
		/* todo 对方信息 */
		pramas.map(elem => {
			const format = ChatMessage.ChatHistory2ChatMessage(elem, 'text', { agentId: chatId, username: chatTitle.value })
			msgList.value.push(...format)
		})
	}


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

			canStopChat.value = true;

			const params = {
				query: message,
				inputs: {
					agent_id: chatId,
					is_think: 'N'
				},
				response_mode: 'streaming',
				conversation_id: conversationId,
				auto_generate_name: true
			};

			const setTaskId = (id : string) => {
				console.log('POST_CHAT_COMPLETIONS taskId', id);
				taskId = id;
			};

			const onChar = (char : string) => {
				console.log('Received char:', char);
				const existingStreamMsg = msgList.value.find(msg => msg.msg.id === currentTextID);

				if (existingStreamMsg) {
					existingStreamMsg.msg.content.text += char;
				} else {
					msgList.value.push(new ChatMessage({
						type: 'user',
						msg: {
							id: currentTextID,
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
					const textIDList = AppStorage.get('textIDList') as string[] ?? [];
					const newTextIdList = [...textIDList, currentTextID];
					AppStorage.set('textIDList', newTextIdList);
					currentTextID = (Date.now() * Math.random() | 0).toString();

					// 更新会话历史
					const historyResponse = await GET_CHAT_HISTORY({
						agent_id: chatId,
						page: 1,
						page_size: 1,
						sort_by: '-updated_at'
					}) as ChatResponse;

					const successfully = sessionStore.setSessionList(historyResponse.items);

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

			await POST_CHAT_COMPLETIONS(params, undefined, setTaskId, onChar, onDone);
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
		playMsgid.value = msg.id
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
		if (isRefreshing.value) return
		isRefreshing.value = true

		try {
			// 模拟加载新消息
			await new Promise(resolve => setTimeout(resolve, 1000))

			// 添加新消息到列表开头
			const newMessages = [
				// 自己文本
				new ChatMessage({
					type: 'user',
					msg: {
						id: 'msg_2',
						type: 'text',
						userinfo: {
							uid: '1',
							username: '我',
							face: '/static/logo.png'
						},
						content: { text: '我想了解你们的产品细节。' },
						time: new Date(Date.now() - 1000 * 60 * 60 * 1.8),
						conversation_id: conversationId
					}
				})
				,
				// 对方图片
				new ChatMessage({
					type: 'user',
					msg: {
						id: 'msg_3',
						type: 'img',
						userinfo: {
							uid: '2',
							username: '对方',
							face: '/static/logo.png'
						},
						content: {
							url: '/static/female-model-9565629_1280.jpg',
							w: 200,
							h: 200
						},
						time: new Date(Date.now() - 1000 * 60 * 60 * 1.7),
						conversation_id: conversationId
					}
				}),
				// 自己图片
				new ChatMessage({
					type: 'user',
					msg: {
						id: 'msg_4',
						type: 'img',
						userinfo: {
							uid: '1',
							username: '我',
							face: '/static/logo.png'
						},
						content: {
							url: '/static/female-model-9565629_1280.jpg',
							w: 180,
							h: 180,
						},
						time: new Date(Date.now() - 1000 * 60 * 60 * 1.6),
						conversation_id: conversationId
					}
				}),
				// 对方语音
				new ChatMessage({
					type: 'user',
					msg: {
						id: 'msg_5',
						type: 'voice',
						userinfo: {
							uid: '2',
							username: '对方',
							face: '/static/logo.png'
						},
						content: { voiceUrl: '/static/voice.mp3', duration: 6 },
						time: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
						conversation_id: conversationId
					}
				}),
				// 自己语音
				new ChatMessage({
					type: 'user',
					msg: {
						id: 'msg_6',
						type: 'voice',
						userinfo: {
							uid: '1',
							username: '我',
							face: '/static/logo.png'
						},
						content: { voiceUrl: '/static/voice.mp3', duration: 4 },
						time: new Date(Date.now() - 1000 * 60 * 60 * 1.4),
						conversation_id: conversationId
					}
				})
			].sort((a, b) => Math.random() - 0.5)

			msgList.value = [...newMessages, ...msgList.value]

		} catch (error) {

			console.error('刷新失败:', error)
			uni.showToast({
				title: '刷新失败',
				icon: 'error',
				duration: 1500
			})
		} finally {
			isRefreshing.value = false
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
			if(msgList.value.length < 1){
				return
			}
			uni.showModal({
				title: '清除对话消息',
				content: '对话消息清除后将失去以往记忆，确定清除吗？',
				confirmText: '清除',
				confirmColor: '#1890ff',
				success: function (res) {
					if (res.confirm) {
						sessionStore.removeSession(conversationId);
						messageStore.deleteMessages(chatId)
						msgList.value = []
						DELETE_CONVERSATIONS(conversationId).then(res => {
							console.log('清除成功');
						}).catch(err=>{
							console.log('清除失败' + JSON.stringify(err));
						})
					}
				}
			})
		} catch (error) {
			console.error('清空输入失败:', error);
		}
	};
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
		overflow: hidden;
		margin-top: 0;
		margin-bottom: 80px;
		background-color: #f5f5f5;
		padding-top: 10rpx;
	}
</style>