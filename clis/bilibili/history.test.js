import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApiGet, mockRunBiliJson } = vi.hoisted(() => ({
    mockApiGet: vi.fn(),
    mockRunBiliJson: vi.fn(),
}));

vi.mock('./utils.js', async (importOriginal) => ({
    ...(await importOriginal()),
    apiGet: mockApiGet,
}));

vi.mock('./external-bridge.js', async (importOriginal) => ({
    ...(await importOriginal()),
    runBiliJson: mockRunBiliJson,
}));

import { getRegistry } from '@jackwener/opencli/registry';
import './history.js';

describe('bilibili history command', () => {
    beforeEach(() => {
        mockApiGet.mockReset();
        mockRunBiliJson.mockReset();
    });

    it('uses bridge backend when requested', async () => {
        mockRunBiliJson.mockReturnValue({
            ok: true,
            data: {
                items: [{ bvid: 'BV1', title: '视频1', author: 'UP1', viewed_at: '2026-06-02T10:00:00' }],
            },
        });
        const command = getRegistry().get('bilibili/history');
        const rows = await command.func(null, { backend: 'bridge', limit: 10 });
        expect(mockRunBiliJson).toHaveBeenCalledWith(['history']);
        expect(mockApiGet).not.toHaveBeenCalled();
        expect(rows).toEqual([{
            rank: 1,
            title: '视频1',
            author: 'UP1',
            progress: '',
            viewed_at: '2026-06-02T10:00:00',
            url: 'https://www.bilibili.com/video/BV1',
            bvid: 'BV1',
        }]);
    });
});
