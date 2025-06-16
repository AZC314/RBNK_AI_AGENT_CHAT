
export class SessionModel {
	/** 会话的唯一标识 (不是用户id后面改成agent_Id)*/
	userId : string;

	/** 对方用户名（用于展示） */
	username : string;

	/** 对方部门名称或标识 */
	department : string;
	/** 对方头像 URL */
	avatarUrl : string;

	/** 最近一条消息内容 */
	lastMessage : string;

	/** 最近一条消息的时间 */
	lastMessageTime : Date;

	/** 未读消息数量 */
	unreadCount : number;

	/** 是否置顶该会话 */
	isPinned : boolean;
	/* 会话唯一标识 */
	conversation_id : string;

	/** 构造函数，初始化单聊会话 */
	constructor(params : {
		userId : string;
		username : string;
		department : string;
		avatarUrl ?: string;
		lastMessage ?: string;
		lastMessageTime ?: Date;
		unreadCount ?: number;
		isPinned ?: boolean;
		conversation_id ?: string
	}) {
		this.userId = params.userId;                             // 设置用户 ID
		this.username = params.username;                         // 设置用户名
		this.department = params.department;                     // 设置部门标识
		this.avatarUrl = params.avatarUrl ?? '';                 // 设置头像
		this.lastMessage = params.lastMessage ?? '';             // 最近消息
		this.lastMessageTime = params.lastMessageTime ?? new Date(); // 消息时间
		this.unreadCount = params.unreadCount ?? 0;              // 未读数量
		this.isPinned = params.isPinned ?? false;                // 是否置顶
		this.conversation_id = params.conversation_id ?? 'nuknow'
	}
	static chatHistory2SessionModel(params : {
		id : number,
		conversation_id : string,
		final_query : string,
		user_id : number,
		agent_id : number,
		created_at : string,
		updated_at : string,
		agent_name : string,
		agent_icon : string
	}) {
		return new SessionModel({
			userId: params.agent_id.toFixed(),
			username: params.agent_name ?? '无名氏',
			department: '',
			avatarUrl: params.agent_icon,
			lastMessage: params.final_query,
			lastMessageTime: new Date(params.updated_at),
			unreadCount: 0,
			isPinned: false,
			conversation_id: params.conversation_id
		})
	}
	/** 增加未读消息数（默认+1） */
	incrementUnreadCount(count : number = 1) : void {
		this.unreadCount += count;
	}

	/** 重置未读消息数为 0 */
	resetUnreadCount() : void {
		this.unreadCount = 0;
	}

	/** 更新最近一条消息和时间 */
	updateLastMessage(message : string, time : Date) : void {
		this.lastMessage = message;
		this.lastMessageTime = time;
	}

	/** 切换置顶状态 */
	togglePin() : void {
		this.isPinned = !this.isPinned;
	}
}