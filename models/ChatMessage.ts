import { AppStorage } from "@/stores/AppStorage"
import { Info } from "./INFO"

// 定义消息类型枚举（文本、图片、语音、文件、视频）
type MsgType = 'text' | 'img' | 'voice' | 'file' | 'video' | 'chart' | 'markdown'

// 定义消息内容接口，根据不同消息类型使用对应字段
export interface MessageContent {
	text ?: string               // 文本内容，仅 text 类型使用

	url ?: string                // 图片 URL，仅 img 类型使用
	w ?: number                  // 图片宽度
	h ?: number                  // 图片高度

	voiceUrl ?: string           // 语音 URL，仅 voice 类型使用
	duration ?: number           // 媒体时长，适用于语音和视频（单位：秒）

	fileName ?: string           // 文件名，仅 file 类型使用
	fileSize ?: number           // 文件大小（单位：字节）
	fileUrl ?: string            // 文件下载地址

	videoUrl ?: string           // 视频 URL，仅 video 类型使用
	coverImage ?: string         // 视频封面图地址
	// duration?:string  			 // 视频秒数

	// 图表配置，仅 chart 类型使用
	// 推荐：完整 ECharts option 对象（优先级最高）
	option ?: any // EChartsOption，完整配置对象，推荐直接传递

	// 兼容老格式：单独字段（不推荐，建议用 option）
	title ?: { text : string }     // 图表标题
	tooltip ?: {}                 // 图表提示框配置
	xAxis ?: { data : string[] }   // 图表 x 轴数据
	yAxis ?: {}                   // 图表 y 轴配置
	series ?: {                   // 图表系列数据
		type : string
		data : number[]
	}[]
}

// 定义用户信息接口
export interface UserInfo {
	uid ?: string                 // 用户唯一 ID
	agentId ?: string				//数字人ID
	username ?: string            // 用户昵称
	face ?: string                // 用户头像 URL
	departmentName ?: string      //所属部门
	departmentId ?: number			//所属部门ID
}

// 定义消息主体内容接口
export interface InnerMessage {
	id : string                  // 消息唯一 ID message_id 
	type : MsgType               // 消息内容类型
	content : MessageContent     // 消息内容体
	userinfo ?: UserInfo         // 用户信息，仅 user 消息类型存在
	time : Date                // 消息发送时间戳（毫秒）
	conversation_id : string
	streaming ?: boolean
}

// 定义聊天消息类（系统消息 / 用户消息的统一模型）
export default class ChatMessage {
	private _type : 'system' | 'user'     // 顶层消息类型：系统 or 用户
	private _msg : InnerMessage           // 具体消息内容

	// 构造函数：接收后端返回的原始数据并规范化
	constructor(data : {
		type : 'system' | 'user',
		msg : InnerMessage
	}) {
		this._type = data.type
		this._msg = {
			id: data.msg.id,
			type: data.msg.type,
			content: data.msg.content ?? {},
			time: data.msg.time ?? Date.now(),
			conversation_id: data.msg.conversation_id ?? 'unKnown',
			// 如果是用户消息但未提供用户信息，使用默认空值占位
			userinfo: data.type === 'user'
				? data.msg.userinfo ?? {
					uid: '',
					username: '未知用户',
					face: ''
				}
				: undefined
		}
	}


	get type() : "system" | "user" {
		return this._type;
	}

	set type(value : "system" | "user") {
		this._type = value;
	}

	get msg() : InnerMessage {
		return this._msg;
	}

	set msg(value : InnerMessage) {
		this._msg = value;
	}

	static ChatHistory2ChatMessage(params : Info.message, msgType ?: MsgType, userInfo ?: UserInfo) {
		const myInfo = AppStorage.get('userInfo') as Info.User
		const myMsg = new ChatMessage({
			type: 'user',
			msg: {
				id: params.message_id,
				type: 'text',
				content: { text: params.query },
				userinfo: {
					uid: myInfo.id.toString(),
					username: myInfo.username,
					face: myInfo.avatar
				},
				time: new Date(params.created_at),
				conversation_id: params.conversation_id
			}
		})
		const otherMsg = new ChatMessage({
			type: 'user',
			msg: {
				id: params.message_id,
				type: "markdown",
				content: { text: '# ' + params.content },
				userinfo: userInfo,
				time: new Date(params.created_at),
				conversation_id: params.conversation_id
			}
		})
		return [myMsg, otherMsg]
	}

	isSelf(currentUID : string | number) : boolean {
		const UID = typeof currentUID === 'number' ? currentUID.toString() : currentUID;
		const userinfoID = this._msg.userinfo?.uid;
		return this._type === 'user' && this._msg.userinfo?.uid === UID;
	}


}