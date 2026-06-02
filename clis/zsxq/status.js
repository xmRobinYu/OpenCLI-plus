import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseStatusRows, runZsxqJson } from './external-bridge.js';

cli({
    site: 'zsxq',
    name: 'status',
    access: 'read',
    description: '通过 zsxq-cli 检查当前知识星球登录状态',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['authenticated', 'user_id', 'name', 'message'],
    func: async () => parseStatusRows(runZsxqJson(['auth', 'status'])),
});
