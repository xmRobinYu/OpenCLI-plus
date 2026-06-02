import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseFootprintRows, runZsxqJson } from './external-bridge.js';

cli({
    site: 'zsxq',
    name: 'footprints',
    access: 'read',
    description: '通过 zsxq-cli 查看当前账号跨星球发帖足迹',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'limit', type: 'int', default: 20, help: 'Maximum items to return' },
    ],
    columns: ['rank', 'group_id', 'group_name', 'topic_id', 'title', 'time', 'url'],
    func: async (args) => parseFootprintRows(runZsxqJson(['user', '+footprints']), Number(args.limit) || 20),
});
