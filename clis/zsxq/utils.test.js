import { describe, expect, it } from 'vitest';
import { getTopicText, parseTopicTarget, toTopicRow, topicToArticleData } from './utils.js';

describe('zsxq utils', () => {
    it('keeps title and content separate when both fields exist', () => {
        const topic = {
            topic_id: '123',
            title: 'A full title that should not be truncated',
            talk: { text: 'This is the full body text.' },
        };

        expect(getTopicText(topic)).toBe('A full title that should not be truncated');
        expect(toTopicRow(topic)).toMatchObject({
            title: 'A full title that should not be truncated',
            content: 'This is the full body text.',
        });
    });

    it('falls back to body text for title when explicit title is absent', () => {
        const topic = {
            topic_id: '456',
            talk: { text: 'Body-only topic text should still appear as the title preview.' },
        };

        expect(getTopicText(topic)).toBe('Body-only topic text should still appear as the title preview.');
        expect(toTopicRow(topic)).toMatchObject({
            title: 'Body-only topic text should still appear as the title preview.',
            content: 'Body-only topic text should still appear as the title preview.',
        });
    });

    it('parses a topic id out of a full topic URL', () => {
        expect(parseTopicTarget('https://wx.zsxq.com/topic/123456789')).toEqual({ topicId: '123456789' });
    });

    it('builds article export data from rich topic content', () => {
        const topic = {
            topic_id: '789',
            type: 'talk',
            title: '知识星球导出测试',
            create_time: '2026-06-01T12:34:56.000+0800',
            likes_count: 3,
            readers_count: 9,
            comments_count: 1,
            talk: {
                owner: { name: 'Robin' },
                text: '第一段<br />第二段<e type="web" href="https%3A%2F%2Fexample.com" title="%E9%93%BE%E6%8E%A5">link</e><e type="image" src="https://img.example.com/1.png"></e>',
                images: [{ large: { url: 'https://img.example.com/1.png' } }],
            },
        };
        const article = topicToArticleData(topic, [{ owner: { name: 'Alice' }, text: '好文' }], 'https://wx.zsxq.com/topic/789');
        expect(article.title).toBe('知识星球导出测试');
        expect(article.author).toBe('Robin');
        expect(article.publishTime).toContain('2026-06-01');
        expect(article.contentHtml).toContain('<a href="https://example.com">链接</a>');
        expect(article.contentHtml).toContain('<img src="https://img.example.com/1.png" alt="图片" />');
        expect(article.contentHtml).toContain('<h2>评论</h2>');
        expect(article.imageUrls).toEqual(['https://img.example.com/1.png']);
    });
});
