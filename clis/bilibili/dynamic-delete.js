import { cli, Strategy } from '@jackwener/opencli/registry';
import { ArgumentError } from '@jackwener/opencli/errors';
import { parseDynamicActionRows, runBiliJson } from './external-bridge.js';

cli({
    site: 'bilibili',
    name: 'dynamic-delete',
    access: 'write',
    description: '通过 bilibili-cli 删除一条动态',
    strategy: Strategy.LOCAL,
    browser: false,
    args: [
        { name: 'id', positional: true, required: true, help: 'Dynamic ID' },
        { name: 'execute', type: 'boolean', help: 'Actually delete the dynamic' },
    ],
    columns: ['success', 'action', 'dynamic_id', 'text'],
    func: async (args) => {
        const id = String(args.id ?? '').trim();
        if (!id) throw new ArgumentError('bilibili dynamic-delete id cannot be empty');
        if (!args.execute) throw new ArgumentError('Refusing to delete: pass --execute to actually delete this dynamic');
        return parseDynamicActionRows(runBiliJson(['dynamic-delete', id, '--yes']), 'dynamic_delete');
    },
});
