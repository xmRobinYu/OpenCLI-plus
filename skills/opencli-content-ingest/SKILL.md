---
name: opencli-content-ingest
description: Use when exporting Feishu/Lark docs or 知识星球 topics into local Markdown with OpenCLI. Trigger on requests to 抓取飞书文档、导出知识星球内容、save a Feishu page, export a ZSXQ topic, or verify the new content-download adapters.
allowed-tools: Bash(opencli:*), Read, Edit, Write
---

# opencli-content-ingest

Use the built-in adapters first. Do not re-script a browser flow when the adapter already covers the task.

## Commands

```bash
opencli feishu doc --url "https://team.feishu.cn/docx/..." --output ./feishu
opencli zsxq download 123456789 --output ./zsxq
```

## Workflow

1. Verify prerequisites:
   - `opencli doctor` for browser-backed commands
   - Chrome is already logged into the target site
2. Prefer direct export:
   - Feishu/Lark page: `opencli feishu doc`
   - ZSXQ topic: `opencli zsxq download`
3. If export fails:
   - Re-run with `-v`
   - Check whether the user is on the correct logged-in page
   - For adapter regressions, switch to `opencli-autofix`

## Notes

- `feishu doc` is page-oriented: it exports the exact doc/wiki page URL you pass.
- `zsxq download` accepts a topic id or a `https://wx.zsxq.com/topic/<id>` URL.
- `--stdout` is useful when another tool needs the Markdown body directly.
