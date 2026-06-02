import { execFileSync } from 'node:child_process';
import { CommandExecutionError } from '@jackwener/opencli/errors';

function extractData(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new CommandExecutionError('zsxq-cli returned an unreadable payload');
    }
    if (payload.ok === false) {
        const message = payload.error?.message || payload.error?.code || 'zsxq-cli reported an error';
        throw new CommandExecutionError(String(message));
    }
    return payload.data ?? payload;
}

export function runZsxqJson(args) {
    let stdout = '';
    try {
        stdout = execFileSync('zsxq-cli', [...args, '--json'], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env,
        });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            throw new CommandExecutionError('zsxq-cli command not found', 'Run `opencli external install zsxq-cli` first.');
        }
        const stdoutText = error?.stdout ? String(error.stdout).trim() : '';
        if (stdoutText) {
            try {
                return JSON.parse(stdoutText);
            } catch {
                // fall through
            }
        }
        const stderr = error?.stderr ? String(error.stderr) : '';
        const message = stderr.trim() || error?.message || 'Failed to execute zsxq-cli';
        throw new CommandExecutionError(message);
    }
    try {
        return JSON.parse(stdout);
    } catch {
        throw new CommandExecutionError('zsxq-cli returned invalid JSON');
    }
}

export function parseStatusRows(payload) {
    const data = extractData(payload);
    return [{
        authenticated: Boolean(data.authenticated ?? data.logged_in ?? data.loggedIn ?? true),
        user_id: data.user_id ?? data.userId ?? data.user?.user_id ?? '',
        name: data.name ?? data.nickname ?? data.user?.name ?? data.user?.nickname ?? '',
        message: '',
    }];
}

export function parseUserRows(payload) {
    const data = extractData(payload);
    const user = data.user ?? data;
    return [{
        user_id: user.user_id ?? user.userId ?? '',
        name: user.name ?? user.nickname ?? '',
        avatar_url: user.avatar_url ?? user.avatarUrl ?? '',
        certified: user.is_certified ?? user.certified ?? '',
    }];
}

export function parseFootprintRows(payload, limit = 20) {
    const data = extractData(payload);
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : Array.isArray(data.footprints) ? data.footprints : [];
    return items.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        group_id: item.group_id ?? item.groupId ?? '',
        group_name: item.group_name ?? item.groupName ?? item.group?.name ?? '',
        topic_id: item.topic_id ?? item.topicId ?? '',
        title: item.title ?? item.text ?? '',
        time: item.create_time ?? item.time ?? '',
        url: item.url ?? (item.group_id && item.topic_id ? `https://wx.zsxq.com/group/${item.group_id}/topic/${item.topic_id}` : ''),
    }));
}
