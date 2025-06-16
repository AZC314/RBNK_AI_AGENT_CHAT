export namespace DateTool {
	function padZero(num : number) : string {
		return num < 10 ? '0' + num : num.toString();
	}
	/* 
	 *格式化输出
	 */
	export function formatTimeAgo(date : Date) : string {
		const nowTimestamp = Date.now();
		const timestamp = date.getTime();
		const diff = nowTimestamp - timestamp;

		const diffInSeconds = Math.floor(diff / 1000);
		const diffInMinutes = Math.floor(diffInSeconds / 60);
		const diffInHours = Math.floor(diffInMinutes / 60);
		const diffInDays = Math.floor(diffInHours / 24);

		const dayOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

		if (diffInSeconds < 10) {
			return '刚刚';
		} else if (diffInMinutes < 1) {
			return `${diffInSeconds}秒前`;
		} else if (diffInMinutes < 60) {
			return `${diffInMinutes}分钟前`;
		} else if (diffInHours < 24) {
			return `${diffInHours}小时前`;
		} else if (diffInDays === 1) {
			return '昨天';
		} else if (diffInDays === 2) {
			return '前天';
		} else if (diffInDays < 7) {
			return dayOfWeek[date.getDay()];
		} else {
			return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
		}
	}

	/**
	  * 将形如 "2025-5-12 14:32:53:457" 的字符串解析为 Date 对象
	  */
	export function parseDateString(dateStr : string) : Date | null {
		// 替换中文冒号为英文冒号
		let normalized = dateStr.replace(/：/g, ':').trim();

		// 将最后一个冒号替换为点，表示毫秒：例如 14:32:53:457 → 14:32:53.457
		normalized = normalized.replace(/:(\d{3})$/, '.$1');

		// 用 Date 构造函数尝试解析
		const date = new Date(normalized);

		// 判断是否有效
		if (isNaN(date.getTime())) {
			return null; // 无效时间字符串
		}

		return date;
	}

	/**
	 * 将时间戳（毫秒）转换为 Date 对象
	 * @param timestamp - 时间戳（单位：毫秒）
	 * @returns Date 实例
	 */
	export function timestampToDate(timestamp : number) : Date {
		return new Date(timestamp);
	}
}