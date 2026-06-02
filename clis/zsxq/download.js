import { cli, Strategy } from '@jackwener/opencli/registry';
import { downloadArticle } from '@jackwener/opencli/download/article-download';
import { CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';
import { browserJsonRequest, ensureZsxqAuth, ensureZsxqPage, getCommentsFromResponse, getTopicFromResponse, parseTopicTarget, topicToArticleData } from './utils.js';

cli({
    site: 'zsxq',
    name: 'download',
    access: 'read',
    description: '导出知识星球话题为 Markdown',
    domain: 'wx.zsxq.com',
    strategy: Strategy.COOKIE,
    browser: true,
    args: [
        { name: 'target', required: true, positional: true, help: 'Topic ID or wx.zsxq.com/topic/<id> URL' },
        { name: 'output', default: './zsxq-articles', help: 'Output directory' },
        { name: 'download-images', type: 'boolean', default: true, help: 'Download images locally' },
        { name: 'stdout', type: 'boolean', default: false, help: 'Print markdown to stdout instead of saving a file' },
        { name: 'comment_limit', type: 'int', default: 20, help: 'Maximum comments to include' },
    ],
    columns: ['title', 'author', 'publish_time', 'status', 'size', 'saved'],
    func: async (page, kwargs) => {
        await ensureZsxqPage(page);
        await ensureZsxqAuth(page);
        const { topicId } = parseTopicTarget(kwargs.target);
        const detailResp = await browserJsonRequest(page, `https://api.zsxq.com/v2/topics/${topicId}`);
        if (!detailResp?.ok) {
            throw new CommandExecutionError(detailResp?.error || `Failed to fetch topic ${topicId}`);
        }
        const topic = getTopicFromResponse(detailResp.data);
        if (!topic) {
            throw new EmptyResultError(`zsxq download ${topicId}`, 'The topic detail payload was empty or malformed');
        }
        const commentLimit = Math.max(0, Number(kwargs.comment_limit) || 0);
        let comments = [];
        if (commentLimit > 0) {
            const commentsResp = await browserJsonRequest(page, `https://api.zsxq.com/v2/topics/${topicId}/comments?sort=asc&count=${commentLimit}`);
            if (commentsResp?.ok) {
                comments = getCommentsFromResponse(commentsResp.data);
            }
        }
        const sourceUrl = `https://wx.zsxq.com/topic/${topicId}`;
        const article = topicToArticleData({
            ...topic,
            comments,
            comments_count: topic.comments_count ?? comments.length,
        }, comments, sourceUrl);
        return downloadArticle(article, {
            output: kwargs.output,
            downloadImages: kwargs['download-images'],
            imageHeaders: { Referer: 'https://wx.zsxq.com/' },
            stdout: kwargs.stdout,
            frontmatterLabels: { author: '作者', publishTime: '发布时间', sourceUrl: '原话题链接' },
        });
    },
});
