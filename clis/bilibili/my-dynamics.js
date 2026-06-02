import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseFeedEnvelope, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'my-dynamics',
    access: 'read',
    description: '通过 bilibili-cli 读取我发布的动态',
    strategy: Strategy.LOCAL,
    browser: false,
    defaultFormat: 'json',
    args: [
        { name: 'offset', type: 'int', default: 0, help: 'Pagination offset returned by a previous my-dynamics call' },
        { name: 'limit', type: 'int', default: 20, help: 'Maximum items to return from the current page' },
    ],
    func: async (args) => {
        const offset = Number(args.offset) || 0;
        const limit = Number(args.limit) || 20;
        return parseFeedEnvelope(runBiliJson(['my-dynamics', '--offset', String(offset), '--max', String(limit)]), limit);
    },
});
