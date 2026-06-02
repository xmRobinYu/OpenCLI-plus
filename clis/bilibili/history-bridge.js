import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseHistoryRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'history-bridge',
    access: 'read',
    description: '兼容桥接命令：通过 bilibili-cli 读取观看历史；优先使用 bilibili history --backend bridge',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'limit', type: 'int', default: 30, help: 'Maximum items to return' },
    ],
    columns: ['rank', 'bvid', 'title', 'author', 'viewed_at'],
    func: async (args) => parseHistoryRows(runBiliJson(['history']), Number(args.limit) || 30),
});
