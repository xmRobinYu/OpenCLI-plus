import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseStatusRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'status',
    access: 'read',
    description: '通过 bilibili-cli 检查当前 B 站登录状态',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['authenticated', 'name', 'uid', 'level', 'message'],
    func: async () => parseStatusRows(runBiliJson(['status'])),
});
