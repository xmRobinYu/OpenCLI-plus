import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApiGet, mockResolveUid, mockRunBiliJson } = vi.hoisted(() => ({
    mockApiGet: vi.fn(),
    mockResolveUid: vi.fn(),
    mockRunBiliJson: vi.fn(),
}));

vi.mock('./utils.js', async (importOriginal) => ({
    ...(await importOriginal()),
    apiGet: mockApiGet,
    resolveUid: mockResolveUid,
}));

vi.mock('./external-bridge.js', async (importOriginal) => ({
    ...(await importOriginal()),
    runBiliJson: mockRunBiliJson,
}));

import { getRegistry } from '@jackwener/opencli/registry';
import './feed.js';

describe('bilibili feed command', () => {
    beforeEach(() => {
        mockApiGet.mockReset();
        mockResolveUid.mockReset();
        mockRunBiliJson.mockReset();
    });

    it('uses bridge backend and preserves next_offset', async () => {
        mockRunBiliJson.mockReturnValue({
            ok: true,
            data: {
                items: [{ id: '900', author: { name: 'UP' }, published_label: '1小时前', title: '动态标题', type: 'video', stats: { like: 12 } }],
                next_offset: 'cursor-2',
            },
        });
        const command = getRegistry().get('bilibili/feed');
        const result = await command.func(null, { backend: 'bridge', limit: 10 });
        expect(mockRunBiliJson).toHaveBeenCalledWith(['feed']);
        expect(mockApiGet).not.toHaveBeenCalled();
        expect(result).toEqual({
            items: [{ rank: 1, time: '1小时前', author: 'UP', title: '动态标题', type: 'video', likes: 12, url: 'https://t.bilibili.com/900' }],
            next_offset: 'cursor-2',
        });
    });

    it('rejects bridge backend uid filtering for now', async () => {
        const command = getRegistry().get('bilibili/feed');
        await expect(command.func(null, { backend: 'bridge', uid: '2' })).rejects.toThrow(/uid filtering/);
    });

    it('rejects bridge backend type filtering for now', async () => {
        const command = getRegistry().get('bilibili/feed');
        await expect(command.func(null, { backend: 'bridge', type: 'video' })).rejects.toThrow(/type filtering/);
    });

    it('rejects bridge backend pages for now', async () => {
        const command = getRegistry().get('bilibili/feed');
        await expect(command.func(null, { backend: 'bridge', pages: 2 })).rejects.toThrow(/--pages/);
    });
});
