// utils/markdownRenderer.js
import {
	marked
} from 'marked';
import mermaid from 'mermaid';

// 配置 marked
marked.setOptions({
	breaks: true,
	gfm: true,
	smartypants: true
});

// 配置 mermaid
mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
	flowchart: {
		useMaxWidth: true
	}
});

// 自定义渲染器来处理 mermaid 代码块
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function(code, language) {
	if (language === 'mermaid') {
		return `<div class="mermaid">${code}</div>`;
	}
	return originalCodeRenderer(code, language);
};

/**
 * 渲染 Markdown 并处理 Mermaid 图表
 * @param {string} markdown 
 * @returns {Promise<string>}
 */
export async function renderMarkdown(markdown) {
	// 先渲染 markdown
	const html = marked(markdown, {
		renderer
	});

	// 返回一个 Promise，确保 mermaid 渲染完成
	return new Promise((resolve) => {
		setTimeout(() => {
			try {
				// 在下次 DOM 更新循环后执行 mermaid 渲染
				uni.nextTick(() => {
					try {
						mermaid.init(undefined, '.mermaid');
					} catch (e) {
						console.error('Mermaid rendering error:', e);
					}
					resolve(html);
				});
			} catch (e) {
				console.error('Error in mermaid rendering:', e);
				resolve(html);
			}
		}, 0);
	});
}