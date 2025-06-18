
export namespace Info {

	export interface User {
		id : number;
		username : string;
		email : string;
		full_name : string;
		phone : string;
		avatar : string;
		is_active : boolean;
		is_admin : boolean;
		department_id : number;
		department_name : string;
		role_ids : number[];
		role_names : string[];
		created_at : string;      // ISO 格式字符串
		last_login : string;      // ISO 格式字符串
	}

	export interface ChatHistory {
		id : number,
		conversation_id : string,
		final_query : string,
		user_id : number,
		agent_id : number,
		created_at : string,
		updated_at : string,
		agent_name : string,
		agent_icon : string
	}

	export interface ChatHistoryContext {
		items : ChatHistory[],
		total : number,     //消息总条数
		page : number,	  	//页数
		page_size : 20,	  	//每页消息条数
		total_pages : number	//总页数
	}

	export interface message {
		message_id : string,
		content : string,
		conversation_id : string,
		query : string,
		tokens : number,
		created_at : string,
		inputs : {
			is_think : 'N' | 'Y',
			NUM:any,
			prompt:any
		},
		message_files : [],
		feedback : any,
		retriever_resources : []
	}
	
	export interface digitalHumans {
	 id: number;
	  name: string;  				//数字人姓名
	  description: string;			//数值人描述
	  icon: string;					//数值人头像
	  is_active: boolean;
	  is_digital_human: boolean;
	  department_id: number | null;		//数值人部门ID
	  department_name: string | null;  //数值人部门名称
	  agent_category_id: number;     //agentID
	  category: {    
	    name: string;
	    description: string;         
	    id: number;
	    created_at: string;  
	    updated_at: string;  
	  };
	}
	
	export interface digitalHumansContext{
		data:digitalHumans[],
		total : number,     //消息总条数
		page : number,	  	//页数
		page_size : 20,	  	//每页消息条数
		total_pages : number	//总页数
	}
}