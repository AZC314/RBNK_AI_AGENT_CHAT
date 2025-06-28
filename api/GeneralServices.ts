import { useAvatarStore } from '@/stores/useAvatarStore'
import { GET_AVAILABLE, GET_ME_INFO, GET_CHAT_HISTORY } from '@/api/api'
import { AppStorage } from '@/stores/AppStorage'
import { Info } from '@/models/INFO'
import { LinkManModel } from '@/models/LinkManModel'
import { useChatSessionStore } from '@/stores/useChatSessionStore'
import { useMessageStore } from '@/stores/useMessageStore'
import { USER_INFO, CURRENT_ANENT_INFO, ADDRESS, SESSION_LIST, SESSION_PAGE } from '@/constances/constances'


/**
 * 提供应用所需的各种服务函数
 */
export class GeneralServices {
	/**
	 * 头像管理store，用于获取和存储用户头像信息
	 */
	private avatarStore : any
	/**
	 * 会话管理store，用于获取和存储会话信息
	 */
	private sessionStore : any
	/**
	 * 消息管理store，用于获取和存储消息信息
	 */
	private messageStore : any

	constructor() {

	}

	/**
   * 初始化应用的存储
   *
   * 此函数负责初始化应用中的存储组件：
   * 1. sessionStore.initStore() - 初始化会话存储
   * 2. messageStore.loadFromStorage() - 从存储中加载消息数据
   *
   * 通过这两个操作，确保了在应用启动时，会话信息和消息数据能够被正确地初始化和加载
   */
	initStore() {
		this.avatarStore = useAvatarStore()
		this.sessionStore = useChatSessionStore()
		this.messageStore = useMessageStore()

		this.sessionStore.initStore()
		this.messageStore.loadFromStorage()
	}


	clearStore() {
		this.sessionStore.clearSessions()
		this.messageStore.clearAllMessages()
		AppStorage.delete(ADDRESS)
	}


	/**
	 * 获取联系人列表并存储到本地（递归分页）
	 * @param params 查询参数，如 { page_size: 100, is_digital_human: true }
	 * @param onComplete 完成时回调，返回所有联系人数组
	 */
	handleLinkManList(params : object, onComplete ?: (list : LinkManModel[]) => void) {
		// 调用GET_AVAILABLE方法获取可用资源，并处理返回结果
		GET_AVAILABLE(params).then((res) => {
			// 如果返回结果存在，则调用HandledigitalHumans函数处理数字人类信息
			if (res) {
				this.HandledigitalHumans(res as Info.DigitalHumansContext, params, onComplete)
			}
		})
	}

	/**
	 * 处理数字人接口返回的数据，合并并存储到本地，自动处理分页
	 * @param orginalContext 数字人接口返回的上下文数据
	 * @param params 原始请求参数
	 * @param onComplete 完成时回调，返回所有联系人数组
	 */
	HandledigitalHumans(orginalContext : Info.DigitalHumansContext, params : object, onComplete ?: (list : LinkManModel[]) => void) {
		// 获取总页数和当前页数，用于后续的分页处理
		let total_pages = orginalContext.total_pages;
		let page = orginalContext.page;

		// 从存储中获取已有的联系人列表，如果不存在，则初始化为空数组
		const orginalList = AppStorage.get(ADDRESS) as LinkManModel[] || [];

		// 将接收到的数据转换为LinkManModel实例列表
		let newList = orginalContext.data.map((value : Info.DigitalHumans) => {
			return LinkManModel.digitalHumans2LinkManModel(value);
		});

		// 将转换后的联系人列表追加到存储中的联系人列表后面
		AppStorage.set(ADDRESS, [...orginalList, ...newList]);

		// 检查当前页数是否已经达到总页数，以决定是完成加载还是继续加载下一页
		if (page >= total_pages) {
			// 如果当前页数达到总页数，则获取所有联系人，并调用完成回调函数
			const allContacts = AppStorage.get(ADDRESS);
			onComplete && onComplete(allContacts);
		} else {
			// 否则，更新页数并请求加载下一页的联系人列表
			this.handleLinkManList({ ...(params as any), page: page + 1 }, onComplete);
		}
	}

	/**
	 * 获取当前用户信息，并通过回调返回
	 * @param callback 获取到用户信息后的回调函数
	 */
	handleMeInfo(callback : (userInfo : Info.User) => void) {
		// 请求当前用户的信息
		GET_ME_INFO()
			.then((res) => {
				// 如果响应数据存在，则调用回调函数处理用户信息
				if (res?.data) {
					callback(res.data as Info.User);
				} else {
					// 如果GET_ME_INFO返回的数据为空，则输出警告信息
					console.warn('GET_ME_INFO 返回数据为空');
				}
			})
			.catch((err) => {
				// 输出GET_ME_INFO失败的错误信息
				console.error('GET_ME_INFO 失败：', err);
			});
	}

	/**
	 * 会话列表预处理方法，计算此次递归查询的目标有用条目
	 * @param params 查询参数，如 { page_size: 10, page: Appstore.get(SESSION_PAGE) + 1, sort_by: '-updated_at' }
	 * @param onComplete 完成时回调
	 * @returns 是否继续执行递归查询
	 */
	preHandleSessionList(params : object, onComplete ?: (sessionList : any[]) => void) : boolean {
		// 获取当前sessionStore内session的长度
		const currentSessionLength = this.sessionStore.getSessions.length;

		// 检查当前session长度是否能被10整除
		if (currentSessionLength % 10 !== 0) {
			// 不能被10整除，直接退出刷新并提示
			console.warn('当前会话数量不能被10整除，停止加载更多');
			uni.showToast({
				title: '已加载全部数据',
				icon: 'none',
				duration: 1000
			});
			// 调用完成回调，返回当前所有会话
			onComplete && onComplete(this.sessionStore.getSessions);
			return false; // 不继续执行递归查询
		}

		// 计算目标有用条目：当前长度加10
		const targetUsefulItem = currentSessionLength + 10;



		// 能被10整除，继续执行递归查询
		this.handSessionList(params, targetUsefulItem, onComplete);
		return true;
	}

	/**
	 * 获取会话列表并存储到本地（递归分页）
	 * @param params 查询参数，如 { page_size: 40, sort_by: '-updated_at' }
	 * @param targetUsefulItem 目标有用条目数量
	 * @param onComplete 完成时回调，返回所有会话数组
	 */
	handSessionList(params : object, targetUsefulItem : number, onComplete ?: (sessionList : any[]) => void) {
		// 请求聊天记录，并在获取到数据后处理聊天历史
		GET_CHAT_HISTORY(params).then((res) => {
			// 如果响应存在，则将响应数据作为聊天历史处理
			if (res) {
				this.HandleChatHistory(res as Info.ChatHistoryContext, params, targetUsefulItem, onComplete)
			}
		})
	}

	/**
	 * 处理会话历史接口返回的数据，合并并存储到本地，自动处理分页
	 * @param orginalContext 会话历史接口返回的上下文数据
	 * @param params 原始请求参数
	 * @param targetUsefulItem 目标有用条目数量
	 * @param onComplete 完成时回调，返回所有会话数组
	 */
	HandleChatHistory(orginalContext : Info.ChatHistoryContext, params : object, targetUsefulItem : number, onComplete ?: (sessionList : any[]) => void) {
		// 获取总页数和当前页码
		let total_pages = orginalContext.total_pages;
		let page = orginalContext.page;

		// 当page为1时，清空sessionStore内的所有数据，并初始有用项从0开始
		if (page === 1) {
			this.sessionStore.clearSessions();
		}

		// 计算当前有用的会话数量
		let usefulItem = this.sessionStore.getSessions.length ?? 0;

		// 更新有用的会话数量，考虑到新获取的会话列表
		usefulItem += this.sessionStore.setSessionList(orginalContext.items);

		// 当达到目标有用项数量或当前页达到总页数时，保存当前页码和会话列表，并调用完成回调
		if (usefulItem >= targetUsefulItem || page >= total_pages) {
			AppStorage.set(SESSION_PAGE, page);
			// AppStorage.set(SESSION_LIST, this.sessionStore.getSessions);
			onComplete && onComplete(this.sessionStore.getSessions);
		} else {
			// 否则，递归调用处理下一页的会话列表
			this.handSessionList({ ...(params as any), page: page + 1 }, targetUsefulItem, onComplete);
		}
	}

	/**
	 * 获取用户头像URL
	 * @param id 用户ID
	 * @param url 头像原始URL
	 * @returns 头像完整URL
	 */
	async loadAvatar(id : string, url : string) {
		return await this.avatarStore.getAvatarUrl(id, url)
	}
}

export default new GeneralServices();