import { Info } from "./INFO";

export class LinkManModel {
	/** 用户ID */
	userId : string;

	/** 用户名 */
	name : string;

	/** 部门名称 */
	department : string;
	departmentId : number;

	/** 头像URL */
	avatarUrl : string;

	/** 是否在线 */
	isOnline : boolean;

	/** 职位 */
	position ?: string;

	/** 手机号 */
	phone ?: string;

	/** 邮箱 */
	email ?: string;

	agent_category_id ?: number

	constructor(params : {
		userId : string;
		name : string;
		department : string;
		departmentId ?: number;
		avatarUrl ?: string;
		isOnline ?: boolean;
		position ?: string;
		phone ?: string;
		email ?: string;
		agent_category_id ?: number;
	}) {
		this.userId = params.userId;
		this.name = params.name;
		this.department = params.department;
		this.departmentId = params.departmentId ?? 0;
		this.avatarUrl = params.avatarUrl ?? '';
		this.isOnline = params.isOnline ?? false;
		this.position = params.position;
		this.phone = params.phone;
		this.email = params.email;
		this.agent_category_id = params.agent_category_id;
	}

	static digitalHumans2LinkManModel(params : Info.DigitalHumans) {
		return new LinkManModel({
			userId: params.id.toString(),
			name: params.name,
			department: params.department_name ?? '',
			departmentId: params.department_id ?? 0,
			avatarUrl: params.icon,
			isOnline: params.is_active ?? false,
			position: params.description,
			phone: '',
			email: '',
			agent_category_id: params.agent_category_id
		})
	}
}