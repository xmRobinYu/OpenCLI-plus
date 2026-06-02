import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseWatchLaterRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'watch-later',
    access: 'read',
    description: '通过 bilibili-cli 读取稍后再看列表',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'limit', type: 'int', default: 30, help: 'Maximum items to return' },
    ],
    columns: ['rank', 'bvid', 'title', 'author', 'duration'],
    func: async (args) => parseWatchLaterRows(runBiliJson(['watch-later']), Number(args.limit) || 30),
});
