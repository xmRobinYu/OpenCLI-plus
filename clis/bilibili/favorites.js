import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseFavoriteFoldersRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'favorites',
    access: 'read',
    description: '通过 bilibili-cli 列出当前账号的收藏夹列表',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['id', 'title', 'media_count'],
    func: async () => parseFavoriteFoldersRows(runBiliJson(['favorites'])),
});
