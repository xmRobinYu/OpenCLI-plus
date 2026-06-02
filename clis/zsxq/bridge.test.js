import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExecFileSync } = vi.hoisted(() => ({
    mockExecFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
    execFileSync: mockExecFileSync,
}));

import { getRegistry } from '@jackwener/opencli/registry';
import { CommandExecutionError } from '@jackwener/opencli/errors';
import { parseFootprintRows, parseStatusRows, parseUserRows, runZsxqJson } from './external-bridge.js';
import './status.js';
import './user.js';
import './footprints.js';

describe('zsxq external bridge helpers', () => {
    beforeEach(() => {
        mockExecFileSync.mockReset();
    });

    it('parses status payloads', () => {
        expect(parseStatusRows({
            ok: true,
            data: {
                authenticated: true,
                user_id: '123',
                name: 'Robin',
            },
        })).toEqual([{
            authenticated: true,
            user_id: '123',
            name: 'Robin',
            message: '',
        }]);
    });

    it('parses user payloads', () => {
        expect(parseUserRows({
            ok: true,
            data: {
                user_id: '123',
                name: 'Robin',
                avatar_url: 'https://img.example.com/a.png',
                certified: true,
            },
        })).toEqual([{
            user_id: '123',
            name: 'Robin',
            avatar_url: 'https://img.example.com/a.png',
            certified: true,
        }]);
    });

    it('parses footprint payloads', () => {
        expect(parseFootprintRows({
            ok: true,
            data: {
                items: [
                    { group_id: '1', group_name: 'AI 星球', topic_id: '100', title: '第一篇', time: '2026-06-02', url: 'https://wx.zsxq.com/group/1/topic/100' },
                    { group_id: '2', group_name: '投资星球', topic_id: '200', title: '第二篇', time: '2026-06-01', url: 'https://wx.zsxq.com/group/2/topic/200' },
                ],
            },
        }, 1)).toEqual([{
            rank: 1,
            group_id: '1',
            group_name: 'AI 星球',
            topic_id: '100',
            title: '第一篇',
            time: '2026-06-02',
            url: 'https://wx.zsxq.com/group/1/topic/100',
        }]);
    });

    it('wraps ENOENT as installation hint', () => {
        mockExecFileSync.mockImplementation(() => {
            const err = new Error('missing');
            err.code = 'ENOENT';
            throw err;
        });
        try {
            runZsxqJson(['auth', 'status']);
        } catch (error) {
            expect(error).toBeInstanceOf(CommandExecutionError);
            expect(error.message).toBe('zsxq-cli command not found');
            expect(error.hint).toMatch(/opencli external install zsxq-cli/);
            return;
        }
        throw new Error('Expected runZsxqJson to throw');
    });
});

describe('zsxq bridged commands', () => {
    beforeEach(() => {
        mockExecFileSync.mockReset();
    });

    it('bridges zsxq status', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: { authenticated: true, user_id: '123', name: 'Robin' },
        }));
        const command = getRegistry().get('zsxq/status');
        const rows = await command.func({}, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('zsxq-cli', ['auth', 'status', '--json'], expect.any(Object));
        expect(rows).toEqual([{ authenticated: true, user_id: '123', name: 'Robin', message: '' }]);
    });

    it('bridges zsxq user info', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: { user_id: '123', name: 'Robin', avatar_url: 'https://img.example.com/a.png', certified: true },
        }));
        const command = getRegistry().get('zsxq/user');
        const rows = await command.func({}, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('zsxq-cli', ['user', '+info', '--json'], expect.any(Object));
        expect(rows[0]).toMatchObject({ user_id: '123', name: 'Robin' });
    });

    it('bridges zsxq footprints', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: {
                items: [{ group_id: '1', group_name: 'AI 星球', topic_id: '100', title: '第一篇', time: '2026-06-02', url: 'https://wx.zsxq.com/group/1/topic/100' }],
            },
        }));
        const command = getRegistry().get('zsxq/footprints');
        const rows = await command.func({ limit: 10 }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('zsxq-cli', ['user', '+footprints', '--json'], expect.any(Object));
        expect(rows).toEqual([{
            rank: 1,
            group_id: '1',
            group_name: 'AI 星球',
            topic_id: '100',
            title: '第一篇',
            time: '2026-06-02',
            url: 'https://wx.zsxq.com/group/1/topic/100',
        }]);
    });
});
