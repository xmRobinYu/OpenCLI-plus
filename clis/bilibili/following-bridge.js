import { cli, Strategy } from '@jackwener/opencli/registry';
import { parseFollowingRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'following-bridge',
    access: 'read',
    description: '兼容桥接命令：通过 bilibili-cli 读取当前账号的关注列表；优先使用 bilibili following --backend bridge',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [],
    columns: ['id', 'name', 'sign'],
    func: async () => parseFollowingRows(runBiliJson(['following'])),
});
