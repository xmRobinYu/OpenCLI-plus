# 知识星球 (ZSXQ)

**模式**: 🔐 Browser · **域名**: `wx.zsxq.com`

通过你当前已登录的 Chrome 会话，读取知识星球的星球列表、话题列表、搜索结果、动态，以及单条话题详情；也支持把单条话题导出为 Markdown。

## 命令

| 命令 | 说明 |
|------|------|
| `opencli zsxq groups` | 列出当前账号加入的星球 |
| `opencli zsxq topics` | 列出当前活跃星球的话题 |
| `opencli zsxq topic <id>` | 读取单条话题详情和评论 |
| `opencli zsxq search <keyword>` | 在星球内搜索话题 |
| `opencli zsxq dynamics` | 列出跨星球的最近动态 |
| `opencli zsxq download <target>` | 导出单条话题为 Markdown，包含评论和图片 |

## 使用示例

```bash
# 列出已加入的星球
opencli zsxq groups

# 读取当前活跃星球的话题
opencli zsxq topics --limit 20

# 在当前活跃星球中搜索
opencli zsxq search "opencli"

# 在指定星球中搜索
opencli zsxq search "opencli" --group_id 123456789

# 读取单条话题详情
opencli zsxq topic 987654321 --comment_limit 20

# 读取跨星球最近动态
opencli zsxq dynamics --limit 20

# 按 topic_id 导出 Markdown
opencli zsxq download 987654321 --output ./zsxq

# 直接按话题 URL 导出 Markdown
opencli zsxq download "https://wx.zsxq.com/topic/987654321" --output ./zsxq
```

## 前置条件

- Chrome 已启动，并已登录 [wx.zsxq.com](https://wx.zsxq.com)
- 已安装 [Browser Bridge 扩展](/zh/guide/browser-bridge)

## 说明

- `zsxq topics` 和 `zsxq search` 默认复用当前浏览器里的活跃星球上下文。
- 如果当前没有活跃星球上下文，可以显式传 `--group_id <id>`，或先在浏览器中打开目标星球页面。
- `zsxq groups` 会返回 `group_id`，后续可直接复用。
- `zsxq topic` 在目标不存在时会返回 `NOT_FOUND`，而不是通用抓取错误。
- `zsxq download` 直接使用话题详情接口，所以只传 `topic_id` 也能工作，不依赖 `group_id`。
- Markdown 导出默认写入 `<output>/<topic-title>/<topic-title>.md`；传 `--stdout` 时会直接输出 Markdown 正文，适合管道处理。
