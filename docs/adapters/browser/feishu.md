# Feishu / Lark Docs

**Mode**: 🔐 Browser · **Domains**: `*.feishu.cn`, `*.larksuite.com`

Export an opened Feishu / Lark document page to Markdown through your logged-in browser session.

## Commands

| Command | Description |
|---------|-------------|
| `opencli feishu doc` | Export one Feishu/Lark doc or wiki page to Markdown |

## Usage Examples

```bash
# Export a Feishu doc page to Markdown
opencli feishu doc --url "https://team.feishu.cn/docx/..." --output ./feishu

# Print Markdown to stdout
opencli feishu doc --url "https://team.feishu.cn/wiki/..." --stdout

# Export without downloading images
opencli feishu doc --url "https://team.feishu.cn/docx/..." --no-download-images
```

## Notes

- The command is page-oriented: pass the full doc or wiki page URL you already have access to.
- Export uses the browser-side article extractor, then the shared Markdown pipeline used by `weixin download` and `zhihu download`.
- Remote images can be downloaded locally when the current Feishu session has permission to fetch them.

## Prerequisites

- Chrome running and logged into Feishu / Lark
- [Browser Bridge extension](/guide/browser-bridge) installed
