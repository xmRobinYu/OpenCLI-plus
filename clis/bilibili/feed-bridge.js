import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseFeedEnvelope, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'feed-bridge',
    access: 'read',
    description: '兼容桥接命令：通过 bilibili-cli 读取动态时间线；优先使用 bilibili feed --backend bridge',
    strategy: Strategy.LOCAL,
    browser: false,
    defaultFormat: 'json',
    args: [
        { name: 'offset', help: 'Pagination cursor returned by a previous feed-bridge call' },
        { name: 'limit', type: 'int', default: 20, help: 'Maximum items to return from the current page' },
    ],
    func: async (args) => {
        const cliArgs = ['feed'];
        if (args.offset) {
            cliArgs.push('--offset', String(args.offset));
        }
        return parseFeedEnvelope(runBiliJson(cliArgs), Number(args.limit) || 20);
    },
});
