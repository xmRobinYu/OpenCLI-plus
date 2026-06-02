import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchJson, mockGetSelfUid, mockResolveUid, mockRunBiliJson } = vi.hoisted(() => ({
    mockFetchJson: vi.fn(),
    mockGetSelfUid: vi.fn(),
    mockResolveUid: vi.fn(),
    mockRunBiliJson: vi.fn(),
}));

vi.mock('./utils.js', async (importOriginal) => ({
    ...(await importOriginal()),
    fetchJson: mockFetchJson,
    getSelfUid: mockGetSelfUid,
    resolveUid: mockResolveUid,
}));

vi.mock('./external-bridge.js', async (importOriginal) => ({
    ...(await importOriginal()),
    runBiliJson: mockRunBiliJson,
}));

import { getRegistry } from '@jackwener/opencli/registry';
import './following.js';

describe('bilibili following command', () => {
    beforeEach(() => {
        mockFetchJson.mockReset();
        mockGetSelfUid.mockReset();
        mockResolveUid.mockReset();
        mockRunBiliJson.mockReset();
    });

    it('uses bridge backend when requested', async () => {
        mockRunBiliJson.mockReturnValue({
            ok: true,
            data: {
                items: [{ id: '1', name: 'UP1', sign: '签名1' }],
            },
        });
        const command = getRegistry().get('bilibili/following');
        const rows = await command.func(null, { backend: 'bridge' });
        expect(mockRunBiliJson).toHaveBeenCalledWith(['following']);
        expect(mockFetchJson).not.toHaveBeenCalled();
        expect(rows).toEqual([{ mid: '1', name: 'UP1', sign: '签名1', following: '', fans: '' }]);
    });
});
