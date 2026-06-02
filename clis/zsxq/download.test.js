import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRegistry } from '@jackwener/opencli/registry';
import './download.js';

describe('zsxq download command', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('exports a topic to markdown rows', async () => {
        const command = getRegistry().get('zsxq/download');
        expect(command?.func).toBeTypeOf('function');
        const mockPage = {
            goto: vi.fn().mockResolvedValue(undefined),
            evaluate: vi.fn()
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce({
                ok: true,
                status: 200,
                data: {
                    succeeded: true,
                    resp_data: {
                        topic: {
                            topic_id: '123',
                            type: 'talk',
                            title: '导出标题',
                            create_time: '2026-06-01T10:00:00.000+0800',
                            talk: {
                                owner: { name: 'Robin' },
                                text: '正文内容',
                            },
                        },
                    },
                },
            })
                .mockResolvedValueOnce({
                ok: true,
                status: 200,
                data: {
                    succeeded: true,
                    resp_data: {
                        comments: [{ owner: { name: 'Alice' }, text: '评论内容' }],
                    },
                },
            }),
        };
        const rows = await command.func(mockPage, { target: '123', output: '/tmp/zsxq-test', 'download-images': false, stdout: true, comment_limit: 5 });
        expect(rows[0]).toMatchObject({
            title: '导出标题',
            author: 'Robin',
            status: 'success',
        });
        expect(mockPage.goto).toHaveBeenCalledWith('https://wx.zsxq.com');
    });
});
