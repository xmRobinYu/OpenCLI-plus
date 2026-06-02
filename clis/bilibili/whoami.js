import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseWhoamiRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'whoami',
    access: 'read',
    description: '通过 bilibili-cli 读取当前登录账号的详细信息',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['name', 'uid', 'level', 'coins', 'followers', 'following', 'sign'],
    func: async () => parseWhoamiRows(runBiliJson(['whoami'])),
});
