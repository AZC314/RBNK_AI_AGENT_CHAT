// api/api.ts
import { $ } from '@/tools/request'
import { AppStorage } from '@/stores/AppStorage'

$.config = {
	// 环境地址：DEVELOPER研发地址、TEST测试地址、PRODUCT产品地址
	EnvBase: {
		DEVELOPER: 'http://14.103.131.43:15000/',
		TEST: 'http://14.103.131.43:15000/',
		PRODUCT: 'http://14.103.131.43:15000/',
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

// 获取用户信息
export const GET_ME_INFO = () => $.get('api/users/me')
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
//获取可用的数字人
export const GET_DIGITAL_HUMANS = (params : object) => $.get('/api/agents/available/digital-humans', params)
//获取可用的联系人 api/agents/available
export const GET_AVAILABLE = (params : object) => $.get('/api/agents/available', params)
//删除聊天
export const DELETE_CONVERSATIONS = (conversation_id : string) => { return $.delete(`/api/chat/conversations/${conversation_id}`) }

//获取对话消息历史
export const GET_MESSAGE = (params : object) => $.get('/api/chat/messages', params)
//停止回答
export const POST_CHAT_STOP = (params ?: object) => $.post('/api/chat/stop', params)
//接收问题消息的回答 todo流式实现
/**
 * 发起聊天补全请求，并处理服务器发送事件（SSE）流式响应
 * @param params 请求参数（消息等）
 * @param header 自定义请求头（可选，默认使用全局配置）
 * @param onChar 逐字符回调函数（用于实时显示流式输出）
 * @param onDone 流式传输完成回调函数
 */
export const POST_CHAT_COMPLETIONS = async (
	params ?: object,
	header ?: object,
	setTaskId ?: (taskId : string) => void,
	onChar ?: (char : string) => void,
	onDone ?: () => void,
	setConversationId ?: (key : string) => void
) => {
	// 构建请求URL（使用全局配置的基础地址）
	const url = $.config.Host + '/api/chat/completions';

	// 合并请求头（优先使用传入的header，否则使用全局配置的Header）
	const reqHeader = header ?? $.config.Header!();
	console.log('POST_CHAT_COMPLETIONS reqHeader = ' + JSON.stringify(reqHeader));
	try {
		// 发起POST请求
		const resp = await fetch(url, {
			method: 'POST',
			headers: reqHeader,
			body: JSON.stringify(params)
		});

		// 获取SSE流的ReadableStream reader
		const reader = resp.body?.getReader();
		if (!reader) throw new Error('无法获取 SSE 流 reader');

		// 用于解码流数据的工具
		const decoder = new TextDecoder('utf-8');
		let buffer = ''; // 缓冲区，用于存储未完整接收的数据块
		let needPushTtaskId = true;
		// 持续读取流数据
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				await reader.cancel(); // 流结束时释放资源
				break;
			}

			// 将二进制数据解码为文本并加入缓冲区
			buffer += decoder.decode(value, { stream: true });

			// 按换行符分割处理完整事件行
			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() || ''; // 剩余不完整行放回缓冲区

			// 处理每个完整的事件行
			for (const line of lines) {
				if (!line.startsWith('data:')) continue; // 忽略非数据行

				const jsonStr = line.slice(5).trim(); // 去掉"data:"前缀
				if (!jsonStr) continue; // 忽略空数据

				try {
					const data = JSON.parse(jsonStr);
					if (needPushTtaskId && data.task_id) {
						setTaskId?.(data.task_id)
						needPushTtaskId = false;
					}

					if (data.event === 'workflow_started' && setConversationId) {
						setConversationId(data.conversation_id)
					}
					// 处理工作流结束事件
					if (data.event === 'workflow_finished' && onDone) {
						onDone?.(); // 触发完成回调
						await reader.cancel(); // 主动关闭流
						return; // 直接结束函数
					}

					// 处理消息事件（逐字符输出）
					if (data.event === 'message' && typeof data.answer === 'string') {
						onChar?.(data.answer); // 触发字符回调
						await delayChar(); // 控制输出速度（模拟打字机效果）
					}
				} catch (e) {
					console.warn('JSON 解析失败:', jsonStr); // 错误降级处理
				}
			}
		}
		onDone?.(); // 确保流结束时触发完成回调
	} catch (err) {
		console.error('SSE 流异常:', err); // 全局错误捕获
	}
};

/**
 * 延迟函数（用于控制字符输出速度）
 * @param ms 延迟毫秒数（默认30ms）
 */
function delayChar(ms = 30) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}