import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError } from '@jackwener/opencli/errors';
import { parseDynamicActionRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'dynamic-post',
    access: 'write',
    description: '通过 bilibili-cli 发布纯文本动态',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'text', positional: true, required: true, help: 'Dynamic text content' },
        { name: 'execute', type: 'boolean', help: 'Actually publish the dynamic' },
    ],
    columns: ['success', 'action', 'dynamic_id', 'text'],
    func: async (args) => {
        const text = String(args.text ?? '').trim();
        if (!text) throw new ArgumentError('bilibili dynamic-post text cannot be empty');
        if (!args.execute) throw new ArgumentError('Refusing to publish: pass --execute to actually post this dynamic');
        return parseDynamicActionRows(runBiliJson(['dynamic-post', text]), 'dynamic_post');
    },
});
