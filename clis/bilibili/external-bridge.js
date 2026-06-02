import { execFileSync } from 'node:child_process';
import { CommandExecutionError } from '@jackwener/opencli/errors';

function extractData(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new CommandExecutionError('bilibili-cli returned an unreadable payload');
    }
    if (payload.ok === false) {
        const message = payload.error?.message || payload.error?.code || 'bilibili-cli reported an error';
        throw new CommandExecutionError(String(message));
    }
    return payload.data ?? payload;
}

export function runBiliJson(args) {
    let stdout = '';
    try {
        stdout = execFileSync('bili', [...args, '--json'], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env,
        });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            throw new CommandExecutionError('bili command not found', 'Run `opencli external install bili` first.');
        }
        const stdoutText = error?.stdout ? String(error.stdout).trim() : '';
        if (stdoutText) {
            try {
                return JSON.parse(stdoutText);
            } catch {
                // fall through to stderr/message handling
            }
        }
        const stderr = error?.stderr ? String(error.stderr) : '';
        const message = stderr.trim() || error?.message || 'Failed to execute bili';
        throw new CommandExecutionError(message);
    }
    try {
        return JSON.parse(stdout);
    } catch {
        throw new CommandExecutionError('bilibili-cli returned invalid JSON');
    }
}

export function parseWhoamiRows(payload) {
    const data = extractData(payload);
    const user = data.user ?? {};
    const relation = data.relation ?? {};
    return [{
        name: user.name ?? user.uname ?? '',
        uid: user.uid ?? user.id ?? user.mid ?? '',
        level: user.level ?? user.level_info?.current_level ?? '',
        coins: user.coins ?? '',
        followers: relation.follower ?? relation.followers ?? user.followers ?? user.fans ?? '',
        following: relation.following ?? user.following ?? '',
        sign: user.sign ?? '',
    }];
}

export function parseUserRows(payload) {
    return parseWhoamiRows(payload);
}

export function parseStatusRows(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new CommandExecutionError('bilibili-cli returned an unreadable payload');
    }
    if (payload.ok === false) {
        return [{
            authenticated: false,
            name: '',
            uid: '',
            level: '',
            message: payload.error?.message || payload.error?.code || 'not authenticated',
        }];
    }
    const data = payload.data ?? {};
    const user = data.user ?? {};
    return [{
        authenticated: Boolean(data.authenticated),
        name: user.name ?? user.uname ?? '',
        uid: user.uid ?? user.id ?? user.mid ?? '',
        level: user.level ?? user.level_info?.current_level ?? '',
        message: '',
    }];
}

export function parseFeedRows(payload, limit = 20) {
    return parseFeedEnvelope(payload, limit).items;
}

export function parseFeedEnvelope(payload, limit = 20) {
    const data = extractData(payload);
    const items = Array.isArray(data.items) ? data.items : [];
    const rows = items.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        time: item.published_label ?? item.published_at ?? item.pub_time ?? item.time ?? item.created_at ?? '',
        author: item.author?.name ?? item.author ?? item.user?.name ?? '',
        title: item.title ?? item.text ?? item.content ?? '',
        type: item.type ?? '',
        likes: item.stats?.like ?? item.like_count ?? item.likes ?? '',
        url: item.url ?? (item.id ? `https://t.bilibili.com/${item.id}` : ''),
    }));
    return {
        items: rows,
        next_offset: data.next_offset ?? data.offset ?? '',
    };
}

export function parseFavoriteFoldersRows(payload) {
    const data = extractData(payload);
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
    return items.map((item) => ({
        id: item.id ?? '',
        title: item.title ?? '',
        media_count: item.media_count ?? item.mediaCount ?? '',
    }));
}

export function parseWatchLaterRows(payload, limit = 30) {
    const data = extractData(payload);
    const items = Array.isArray(data.items) ? data.items : [];
    return items.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        bvid: item.bvid ?? item.id ?? '',
        title: item.title ?? '',
        author: item.author ?? item.owner?.name ?? '',
        duration: item.duration ?? '',
    }));
}

export function parseFollowingRows(payload) {
    const data = extractData(payload);
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        sign: item.sign ?? '',
    }));
}

export function parseHistoryRows(payload, limit = 30) {
    const data = extractData(payload);
    const items = Array.isArray(data.items) ? data.items : [];
    return items.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        bvid: item.bvid ?? item.id ?? '',
        title: item.title ?? '',
        author: item.author ?? '',
        viewed_at: item.viewed_at ?? '',
    }));
}

export function parseDynamicActionRows(payload, action) {
    const data = extractData(payload);
    return [{
        success: data.success ?? true,
        action: data.action ?? action,
        dynamic_id: data.dynamic_id ?? '',
        text: data.text ?? '',
    }];
}
