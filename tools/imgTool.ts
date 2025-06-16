
export namespace ImgTool {
	export function getAvatar(avatarUrl : string, username : string) {
		if (avatarUrl && avatarUrl !== '') return avatarUrl;
		return generateTextAvatar(username?.charAt(0) || '?');
	}

	export function generateTextAvatar(char : string) {
		const canvas = document.createElement('canvas');
		const size = 64;
		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#1890FF'; // 背景色
		ctx.fillRect(0, 0, size, size);

		ctx.fillStyle = '#ffffff'; // 文字颜色
		ctx.font = '32px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(char, size / 2, size / 2);

		return canvas.toDataURL('image/png');
	}
}