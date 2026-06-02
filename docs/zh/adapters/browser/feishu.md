# 飞书 / Lark 文档

**模式**: 🔐 Browser · **域名**: `*.feishu.cn`, `*.larksuite.com`

通过你当前已登录的浏览器会话，将单个飞书 / Lark 文档页或 Wiki 页面导出为 Markdown。

## 命令

| 命令 | 说明 |
|------|------|
| `opencli feishu doc` | 导出单个飞书文档页或 Wiki 页面为 Markdown |

## 使用示例

```bash
# 导出飞书文档页为 Markdown
opencli feishu doc --url "https://team.feishu.cn/docx/..." --output ./feishu

# 直接输出 Markdown 到 stdout
opencli feishu doc --url "https://team.feishu.cn/wiki/..." --stdout

# 不下载图片，只保留远程图片链接
opencli feishu doc --url "https://team.feishu.cn/docx/..." --no-download-images
```

## 说明

- 该命令是“页面导出”模式：你传入什么文档页 URL，就导出那个页面。
- 导出流程复用了 OpenCLI 通用的文章抽取器和 Markdown 导出管线，和 `weixin download`、`zhihu download` 一致。
- 如果当前浏览器登录态有权限访问图片资源，`--download-images` 会把图片一并保存到本地。

## 前置条件

- Chrome 已启动，并已登录飞书 / Lark
- 已安装 [Browser Bridge 扩展](/zh/guide/browser-bridge)
