import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExecFileSync } = vi.hoisted(() => ({
    mockExecFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
    execFileSync: mockExecFileSync,
}));

import { getRegistry } from '@jackwener/opencli/registry';
import { CommandExecutionError } from '@jackwener/opencli/errors';
import { parseDynamicActionRows, parseFavoriteFoldersRows, parseFeedEnvelope, parseFeedRows, parseFollowingRows, parseHistoryRows, parseStatusRows, parseUserRows, parseWatchLaterRows, parseWhoamiRows, runBiliJson } from './external-bridge.js';
import './status.js';
import './whoami.js';
import './user.js';
import './favorites.js';
import './watch-later.js';
import './following.js';
import './history.js';
import './feed.js';
import './my-dynamics.js';
import './dynamic-post.js';
import './dynamic-delete.js';

describe('bilibili external bridge helpers', () => {
    beforeEach(() => {
        mockExecFileSync.mockReset();
    });

    it('parses whoami payloads into OpenCLI rows', () => {
        expect(parseWhoamiRows({
            ok: true,
            data: {
                user: { id: '123', name: 'Robin', level: 6, coins: 42, sign: 'hello' },
                relation: { follower: 100, following: 9 },
            },
        })).toEqual([{
            name: 'Robin',
            uid: '123',
            level: 6,
            coins: 42,
            followers: 100,
            following: 9,
            sign: 'hello',
        }]);
    });

    it('parses user payloads into OpenCLI rows', () => {
        expect(parseUserRows({
            ok: true,
            data: {
                user: { id: '456', name: '老番茄', level: 6, sign: 'Hello' },
                relation: { follower: 999, following: 12 },
            },
        })).toEqual([{
            name: '老番茄',
            uid: '456',
            level: 6,
            coins: '',
            followers: 999,
            following: 12,
            sign: 'Hello',
        }]);
    });

    it('parses authenticated status payloads', () => {
        expect(parseStatusRows({
            ok: true,
            data: {
                authenticated: true,
                user: { id: '123', name: 'Robin', level: 6 },
            },
        })).toEqual([{
            authenticated: true,
            name: 'Robin',
            uid: '123',
            level: 6,
            message: '',
        }]);
    });

    it('parses unauthenticated status payloads without throwing', () => {
        expect(parseStatusRows({
            ok: false,
            error: { code: 'not_authenticated', message: '未登录。使用 bili login 登录。' },
        })).toEqual([{
            authenticated: false,
            name: '',
            uid: '',
            level: '',
            message: '未登录。使用 bili login 登录。',
        }]);
    });

    it('parses favorite folder payloads', () => {
        expect(parseFavoriteFoldersRows({
            ok: true,
            data: [
                { id: 1, title: '默认收藏夹', media_count: 12 },
                { id: 2, title: '技术', media_count: 8 },
            ],
        })).toEqual([
            { id: 1, title: '默认收藏夹', media_count: 12 },
            { id: 2, title: '技术', media_count: 8 },
        ]);
    });

    it('parses watch-later payloads', () => {
        expect(parseWatchLaterRows({
            ok: true,
            data: {
                items: [
                    { bvid: 'BV1', title: '视频1', author: 'UP1', duration: '10:20' },
                    { bvid: 'BV2', title: '视频2', author: 'UP2', duration: '08:00' },
                ],
            },
        }, 1)).toEqual([
            { rank: 1, bvid: 'BV1', title: '视频1', author: 'UP1', duration: '10:20' },
        ]);
    });

    it('parses following payloads', () => {
        expect(parseFollowingRows({
            ok: true,
            data: {
                items: [
                    { id: '1', name: 'UP1', sign: '签名1' },
                    { id: '2', name: 'UP2', sign: '签名2' },
                ],
            },
        })).toEqual([
            { id: '1', name: 'UP1', sign: '签名1' },
            { id: '2', name: 'UP2', sign: '签名2' },
        ]);
    });

    it('parses history payloads', () => {
        expect(parseHistoryRows({
            ok: true,
            data: {
                items: [
                    { bvid: 'BV1', title: '视频1', author: 'UP1', viewed_at: '2026-06-02T10:00:00' },
                    { bvid: 'BV2', title: '视频2', author: 'UP2', viewed_at: '2026-06-01T09:00:00' },
                ],
            },
        }, 1)).toEqual([
            { rank: 1, bvid: 'BV1', title: '视频1', author: 'UP1', viewed_at: '2026-06-02T10:00:00' },
        ]);
    });

    it('parses feed payloads', () => {
        expect(parseFeedRows({
            ok: true,
            data: {
                items: [
                    {
                        id: '900',
                        author: { name: 'UP' },
                        published_label: '1小时前',
                        title: '动态标题',
                        type: 'video',
                        stats: { like: 12 },
                    },
                ],
            },
        })).toEqual([
            {
                rank: 1,
                time: '1小时前',
                author: 'UP',
                title: '动态标题',
                type: 'video',
                likes: 12,
                url: 'https://t.bilibili.com/900',
            },
        ]);
    });

    it('parses feed envelopes with next_offset', () => {
        expect(parseFeedEnvelope({
            ok: true,
            data: {
                items: [
                    { id: '900', author: { name: 'UP' }, published_label: '1小时前', title: '动态标题', type: 'video', stats: { like: 12 } },
                ],
                next_offset: 'cursor-2',
            },
        })).toEqual({
            items: [{
                rank: 1,
                time: '1小时前',
                author: 'UP',
                title: '动态标题',
                type: 'video',
                likes: 12,
                url: 'https://t.bilibili.com/900',
            }],
            next_offset: 'cursor-2',
        });
    });

    it('parses dynamic action payloads', () => {
        expect(parseDynamicActionRows({
            ok: true,
            data: { success: true, action: 'dynamic_post', dynamic_id: '123', text: 'hello' },
        }, 'dynamic_post')).toEqual([
            { success: true, action: 'dynamic_post', dynamic_id: '123', text: 'hello' },
        ]);
    });

    it('wraps ENOENT as an installation hint', () => {
        mockExecFileSync.mockImplementation(() => {
            const err = new Error('missing');
            err.code = 'ENOENT';
            throw err;
        });
        try {
            runBiliJson(['whoami']);
        } catch (error) {
            expect(error).toBeInstanceOf(CommandExecutionError);
            expect(error.message).toBe('bili command not found');
            expect(error.hint).toMatch(/opencli external install bili/);
            return;
        }
        throw new Error('Expected runBiliJson to throw');
    });
});

describe('bilibili bridged commands', () => {
    beforeEach(() => {
        mockExecFileSync.mockReset();
    });

    it('bridges bilibili whoami through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: {
                user: { id: '123', name: 'Robin', level: 6, coins: 42, sign: 'hello' },
                relation: { follower: 100, following: 9 },
            },
        }));
        const command = getRegistry().get('bilibili/whoami');
        const rows = await command.func({}, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['whoami', '--json'], expect.any(Object));
        expect(rows[0]).toMatchObject({ name: 'Robin', uid: '123' });
    });

    it('bridges bilibili user through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: {
                user: { id: '456', name: '老番茄', level: 6, sign: 'Hello' },
                relation: { follower: 999, following: 12 },
            },
        }));
        const command = getRegistry().get('bilibili/user');
        const rows = await command.func({ uid_or_name: '老番茄' }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['user', '老番茄', '--json'], expect.any(Object));
        expect(rows[0]).toMatchObject({ name: '老番茄', uid: '456' });
    });

    it('bridges bilibili status through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: {
                authenticated: true,
                user: { id: '123', name: 'Robin', level: 6 },
            },
        }));
        const command = getRegistry().get('bilibili/status');
        const rows = await command.func({}, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['status', '--json'], expect.any(Object));
        expect(rows).toEqual([{
            authenticated: true,
            name: 'Robin',
            uid: '123',
            level: 6,
            message: '',
        }]);
    });

    it('bridges bilibili favorites through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: [{ id: 1, title: '默认收藏夹', media_count: 12 }],
        }));
        const command = getRegistry().get('bilibili/favorites');
        const rows = await command.func({}, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['favorites', '--json'], expect.any(Object));
        expect(rows).toEqual([{ id: 1, title: '默认收藏夹', media_count: 12 }]);
    });

    it('bridges bilibili watch-later through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: { items: [{ bvid: 'BV1', title: '视频1', author: 'UP1', duration: '10:20' }] },
        }));
        const command = getRegistry().get('bilibili/watch-later');
        const rows = await command.func({ limit: 10 }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['watch-later', '--json'], expect.any(Object));
        expect(rows).toEqual([{ rank: 1, bvid: 'BV1', title: '视频1', author: 'UP1', duration: '10:20' }]);
    });


    it('bridges bilibili my-dynamics through bili --json and keeps next_offset', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: {
                items: [{ id: '901', author: { name: 'Me' }, published_label: '刚刚', title: '我的动态', type: 'text', stats: { like: 1 } }],
                next_offset: 'cursor-3',
            },
        }));
        const command = getRegistry().get('bilibili/my-dynamics');
        const result = await command.func({ offset: 0, limit: 10 }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['my-dynamics', '--offset', '0', '--max', '10', '--json'], expect.any(Object));
        expect(result).toEqual({
            items: [{ rank: 1, time: '刚刚', author: 'Me', title: '我的动态', type: 'text', likes: 1, url: 'https://t.bilibili.com/901' }],
            next_offset: 'cursor-3',
        });
    });

    it('refuses bilibili dynamic-post without --execute', async () => {
        const command = getRegistry().get('bilibili/dynamic-post');
        await expect(command.func({ text: 'hello' }, false)).rejects.toThrow(/--execute/);
        expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it('bridges bilibili dynamic-post through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: { success: true, action: 'dynamic_post', dynamic_id: '123', text: 'hello' },
        }));
        const command = getRegistry().get('bilibili/dynamic-post');
        const rows = await command.func({ text: 'hello', execute: true }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['dynamic-post', 'hello', '--json'], expect.any(Object));
        expect(rows).toEqual([{ success: true, action: 'dynamic_post', dynamic_id: '123', text: 'hello' }]);
    });

    it('refuses bilibili dynamic-delete without --execute', async () => {
        const command = getRegistry().get('bilibili/dynamic-delete');
        await expect(command.func({ id: '123' }, false)).rejects.toThrow(/--execute/);
        expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it('bridges bilibili dynamic-delete through bili --json', async () => {
        mockExecFileSync.mockReturnValue(JSON.stringify({
            ok: true,
            data: { success: true, action: 'dynamic_delete', dynamic_id: '123' },
        }));
        const command = getRegistry().get('bilibili/dynamic-delete');
        const rows = await command.func({ id: '123', execute: true }, false);
        expect(mockExecFileSync).toHaveBeenCalledWith('bili', ['dynamic-delete', '123', '--yes', '--json'], expect.any(Object));
        expect(rows).toEqual([{ success: true, action: 'dynamic_delete', dynamic_id: '123', text: '' }]);
    });
});
