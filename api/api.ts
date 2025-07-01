// api/api.ts
import { $ } from '@/tools/request'
import { AppStorage } from '@/stores/AppStorage'
import { REF_TOKEN, TOKEN } from 'constances/constances'

$.config = {
	// 环境地址：DEVELOPER研发地址、TEST测试地址、PRODUCT产品地址
	EnvBase: {
		DEVELOPER: 'http://14.103.131.43:15000',
		TEST: 'http://14.103.131.43:15000',
		PRODUCT: 'http://14.103.131.43:15000',
	},
	// 主机地址
	Host: 'http://14.103.131.43:15000',
	// 请求头（默认请求头为{"Content-Type": "application/json"}）
	Header: () => {
		const token = AppStorage.get('token')
		if (token) {
			return new Object({
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			})
		} else {
			return new Object({ 'Content-Type': 'application/json' })
		}
	},
	NotAuthPage: '/pages/Login',
}

// 设置白名单接口（不带token）
$.setWhiteList(['api/auth/login'])

// token失效时处理
$.onNotAuthChange = () => {
	AppStorage.delete('token')
	/* todo */
	uni.redirectTo({ url: '/pages/Login' })
}

// 接口
//登录
export const POSYT_LOGIN = (params ?: Object) => $.post('/api/auth/login', params)
//刷新Token
// const refreshAccessToken = 

// 获取用户信息
export const GET_ME_INFO = () => $.get('/api/users/me')
// 获取消息列表
export const GET_CHAT_HISTORY = (params ?: Object) => $.get('/api/chat/history', params)
// 获取头像、图片
export const GET_PHOTO = (params : string) => {
	let result = $.config.Host + params;
	console.log('GET_PHOTO 图片地址' + result);
	return $.config.Host + params
}
//获取部门
export const GET_DEPARTMENTS_BY_ANGENT_ID = (dept_id : string) => $.get(`/api/departments/${dept_id}`)
//获取可用的数值人 api/agents/available
export const GET_AVAILABLE = (params : object) => $.get('/api/agents/available', params)
//删除聊天
export const DELETE_CONVERSATIONS = (conversation_id : string) => { return $.delete(`/api/chat/conversations/${conversation_id}`) }

//获取对话消息历史
/**
 * 获取消息列表
 *
 * 该函数通过发送GET请求到API服务器，请求指定参数的相关消息
 * 主要用于在客户端获取聊天消息或通知
 *
 * @param params 请求参数，通常包括页码、消息类型等信息。ps{conversation_id:对话 ID,first_id：用于分页的前一条消息 ID（来自上一条响应）,limit:10}
 * @returns 返回一个Promise对象，解析后提供消息列表
 */
export const GET_MESSAGE = (params : object) => $.get('/api/chat/messages', params)

//停止回答
export const POST_CHAT_STOP = (params ?: object) => $.post('/api/chat/stop', params)
//反馈评价数值人的输出内容
export const POST_MESSAGE_FEEDBACK = (params : { conversation_id : string, message_id : string, rating ?: "dislike" | "like", content ?: string }) => $.post(`/api/chat/conversations/${params.conversation_id}/messages/${params.message_id}/feedback`, new Object({ rating: params?.rating, content: params?.content }))




//接收问题消息的回答 todo流式实现
/**
 * 发起聊天补全请求，并处理服务器发送事件（SSE）流式响应
 * @param params 请求参数（消息等）
 * @param header 自定义请求头（可选，默认使用全局配置）
 * @param getWorkflowInfo 获取当前消息的相关信息的回调
 * @param onChar 逐字符回调函数（用于实时显示流式输出）
 * @param onDone 流式传输完成回调函数
 */
export const POST_CHAT_COMPLETIONS = async (
	params ?: object,
	header ?: object,
	getWorkflowInfo ?: (options : Record<string, string>) => void,
	onChar ?: (char : string, messageId : string) => void,
	onDone ?: () => void
) => {
	return $.postStream(
		'/api/chat/completions',
		params,
		header,
		getWorkflowInfo,
		onChar,
		onDone
	);
};