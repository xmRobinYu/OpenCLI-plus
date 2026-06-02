import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseUserRows, runZsxqJson } from './external-bridge.js';

cli({
    site: 'zsxq',
    name: 'user',
    access: 'read',
    description: '通过 zsxq-cli 读取当前知识星球账号资料',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['user_id', 'name', 'avatar_url', 'certified'],
    func: async () => parseUserRows(runZsxqJson(['user', '+info'])),
});
