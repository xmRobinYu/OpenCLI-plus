import { cli, Strategy } from '@jackwener/opencli/registry';
import { downloadArticle } from '@jackwener/opencli/download/article-download';
import { extractArticle } from '@jackwener/opencli/browser/article-extract';
import { ArgumentError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';

function normalizeFeishuUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) {
        throw new ArgumentError('Document URL is required', 'Pass a Feishu/Lark docs, wiki, or sheet page URL');
    }
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new ArgumentError(`Invalid Feishu URL: ${value}`, 'Pass a full https://... URL');
    }
    const host = parsed.hostname.toLowerCase();
    if (!/feishu\.cn$|larksuite\.com$/.test(host)) {
        throw new ArgumentError(`Unsupported Feishu host: ${parsed.hostname}`, 'Use a Feishu/Lark docs or wiki page URL');
    }
    return parsed.toString();
}

function pickTitle(data, pageTitle) {
    const title = String(data?.title || '').trim();
    if (title)
        return title;
    return String(pageTitle || '').replace(/\s+-\s+飞书.*$/, '').replace(/\s+-\s+Lark.*$/, '').trim() || 'feishu-doc';
}

cli({
    site: 'feishu',
    name: 'doc',
    access: 'read',
    description: '导出飞书文档页面为 Markdown',
    domain: 'feishu.cn',
    strategy: Strategy.COOKIE,
    browser: true,
    navigateBefore: false,
    args: [
        { name: 'url', required: true, help: 'Feishu/Lark doc or wiki page URL' },
        { name: 'output', default: './feishu-docs', help: 'Output directory' },
        { name: 'download-images', type: 'boolean', default: true, help: 'Download images locally' },
        { name: 'stdout', type: 'boolean', default: false, help: 'Print markdown to stdout instead of saving a file' },
        { name: 'wait', type: 'int', default: 3, help: 'Seconds to wait after navigation' },
    ],
    columns: ['title', 'author', 'publish_time', 'status', 'size', 'saved'],
    func: async (page, kwargs) => {
        const url = normalizeFeishuUrl(kwargs.url);
        await page.goto(url);
        await page.wait(Math.max(1, Number(kwargs.wait) || 3));
        const extracted = await extractArticle(page, {
            force: true,
            cleanSelectors: [
                'nav',
                'aside',
                '[data-testid="wiki-sidebar"]',
                '[class*="catalog"]',
                '[class*="sidebar"]',
                '[class*="comment"]',
                '[class*="doc-comment"]',
                '[class*="toolbar"]',
                '[class*="header"]',
                '[class*="breadcrumbs"]',
            ],
        });
        if (!extracted?.html) {
            throw new EmptyResultError(`feishu doc ${url}`, 'The page did not expose readable document content; verify the document is open and fully loaded in Chrome');
        }
        const meta = await page.evaluate(`(() => {
            const q = (selector) => document.querySelector(selector);
            const text = (selector) => q(selector)?.textContent?.trim() || '';
            const authorMeta = q('meta[name="author"]')?.getAttribute('content') || '';
            const publishMeta = q('meta[property="article:published_time"]')?.getAttribute('content')
              || q('meta[name="publish_date"]')?.getAttribute('content')
              || '';
            const imageUrls = Array.from(document.images || [])
              .map((img) => img.getAttribute('src') || '')
              .filter(Boolean)
              .filter((src) => !src.startsWith('data:'));
            return {
              title: document.title || '',
              author: authorMeta || text('[data-testid="page-author"]') || text('[class*="author"]'),
              publishTime: publishMeta,
              imageUrls,
            };
        })()`);
        const result = await downloadArticle({
            title: pickTitle(extracted, meta?.title),
            author: meta?.author || extracted.byline || '',
            publishTime: meta?.publishTime || extracted.publishedTime || '',
            sourceUrl: url,
            contentHtml: extracted.html,
            imageUrls: Array.isArray(meta?.imageUrls) ? meta.imageUrls : [],
        }, {
            output: kwargs.output,
            downloadImages: kwargs['download-images'],
            imageHeaders: { Referer: url },
            stdout: kwargs.stdout,
            frontmatterLabels: { author: '作者', publishTime: '更新时间', sourceUrl: '原文链接' },
        });
        if (!result?.length) {
            throw new CommandExecutionError('Feishu document export returned no rows');
        }
        return result;
    },
});

export const __test__ = {
    normalizeFeishuUrl,
    pickTitle,
};
