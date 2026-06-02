import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseUserRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'user',
    access: 'read',
    description: '通过 bilibili-cli 读取指定 UP 主资料',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'uid_or_name', positional: true, required: true, help: 'UID or username' },
    ],
    columns: ['name', 'uid', 'level', 'coins', 'followers', 'following', 'sign'],
    func: async (args) => parseUserRows(runBiliJson(['user', String(args.uid_or_name)])),
});
