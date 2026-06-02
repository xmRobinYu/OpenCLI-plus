import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRegistry } from '@jackwener/opencli/registry';
import { ArgumentError } from '@jackwener/opencli/errors';
import './doc.js';
import { __test__ } from './doc.js';

describe('feishu doc command', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('normalizes and validates feishu URLs', () => {
        expect(__test__.normalizeFeishuUrl('https://example.feishu.cn/docx/abc')).toBe('https://example.feishu.cn/docx/abc');
        expect(() => __test__.normalizeFeishuUrl('https://example.com/doc')).toThrow(ArgumentError);
    });

    it('falls back to page title when article title is empty', () => {
        expect(__test__.pickTitle({ title: '' }, '需求文档 - 飞书云文档')).toBe('需求文档');
    });

    it('exports a document page to markdown rows', async () => {
        const command = getRegistry().get('feishu/doc');
        expect(command?.func).toBeTypeOf('function');
        const mockPage = {
            goto: vi.fn().mockResolvedValue(undefined),
            wait: vi.fn().mockResolvedValue(undefined),
            evaluate: vi.fn().mockResolvedValue({
                title: '飞书页面标题 - 飞书云文档',
                author: 'Robin',
                publishTime: '2026-06-01 10:00',
                imageUrls: [],
            }),
        };
        const browserModule = await import('@jackwener/opencli/browser/article-extract');
        const extractSpy = vi.spyOn(browserModule, 'extractArticle').mockResolvedValue({
            html: '<article><p>正文</p></article>',
            title: '',
            source: 'readability',
        });
        const rows = await command.func(mockPage, {
            url: 'https://team.feishu.cn/docx/abc',
            output: '/tmp/feishu-test',
            'download-images': false,
            stdout: true,
            wait: 1,
        });
        expect(rows[0]).toMatchObject({
            title: '飞书页面标题',
            author: 'Robin',
            status: 'success',
        });
        expect(extractSpy).toHaveBeenCalled();
    });
});
