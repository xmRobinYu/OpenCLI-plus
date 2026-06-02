# Bilibili / 哔哩哔哩

**模式**: 🔐 Browser · **域名**: `bilibili.com`

通过已登录浏览器会话读取 B 站内容；同时对接 `public-clis/bilibili-cli`，把账号、收藏夹、稍后再看、我发布的动态等能力统一收进 `opencli bilibili ...`。

## 命令

| 命令 | 说明 |
|------|------|
| `opencli bilibili hot` | 读取 B 站热门视频 |
| `opencli bilibili search` | 搜索视频或用户 |
| `opencli bilibili me` | 使用原生浏览器适配器读取当前账号概要 |
| `opencli bilibili status` | 通过 `bili status` 检查当前登录状态 |
| `opencli bilibili whoami` | 通过 `bili whoami` 读取当前账号详细信息 |
| `opencli bilibili user <uid-or-name>` | 通过 `bili user` 读取指定 UP 主资料 |
| `opencli bilibili favorite` | 读取默认收藏夹或指定收藏夹内容 |
| `opencli bilibili favorites` | 通过 `bili favorites` 列出收藏夹列表 |
| `opencli bilibili history` | 读取观看历史；支持 `--backend bridge` |
| `opencli bilibili watch-later` | 通过 `bili watch-later` 读取稍后再看 |
| `opencli bilibili my-dynamics` | 通过 `bili my-dynamics` 读取我发布的动态，并保留 `next_offset` |
| `opencli bilibili dynamic-post` | 通过 `bili dynamic-post` 发布纯文本动态 |
| `opencli bilibili dynamic-delete` | 通过 `bili dynamic-delete` 删除动态 |
| `opencli bilibili feed` | 读取关注时间线或指定用户动态；支持 `--backend bridge` |
| `opencli bilibili feed-detail` | 读取单条动态详情 |
| `opencli bilibili subtitle` | 读取视频字幕 |
| `opencli bilibili video` | 按 BV / URL / b23 短链读取视频元数据 |
| `opencli bilibili summary` | 读取视频官方 AI 总结与时间戳大纲 |
| `opencli bilibili comments` | 读取评论或楼中楼回复 |
| `opencli bilibili comment` | 发表评论或回复（需 `--execute`） |
| `opencli bilibili dynamic` | 使用原生浏览器适配器读取关注动态流 |
| `opencli bilibili ranking` | 读取排行榜 |
| `opencli bilibili following` | 读取关注列表；支持 `--backend bridge` |
| `opencli bilibili user-videos` | 读取指定 UP 主投稿视频 |
| `opencli bilibili download` | 通过 `yt-dlp` 下载视频 |

## 使用示例

```bash
# 热门视频
opencli bilibili hot --limit 5

# 搜索视频
opencli bilibili search 黑神话 --limit 10

# 登录状态 / 当前账号
opencli bilibili status
opencli bilibili whoami

# 指定 UP 主资料
opencli bilibili user 老番茄
opencli bilibili user-videos 2 --limit 10

# 收藏夹 / 稍后再看
opencli bilibili favorites
opencli bilibili favorite --fid 123456789 --limit 10
opencli bilibili watch-later --limit 20

# 关注 / 历史 / 时间线：统一命令名 + bridge 后端
opencli bilibili following --backend bridge
opencli bilibili history --backend bridge --limit 20
opencli bilibili feed --backend bridge -f json
opencli bilibili feed --backend bridge --offset "<cursor>" -f json

# 我发布的动态
opencli bilibili my-dynamics
opencli bilibili my-dynamics --offset 123456

# 写操作必须显式加 --execute
opencli bilibili dynamic-post "这是一条来自 OpenCLI 的动态" --execute
opencli bilibili dynamic-delete 123456789 --execute

# 视频详情 / 字幕 / AI 总结
opencli bilibili video BV1xx411c7mD
opencli bilibili subtitle BV1xx411c7mD --lang zh-CN
opencli bilibili summary BV1xx411c7mD

# 评论读取 / 写入
opencli bilibili comments BV1xx411c7mD --limit 10
opencli bilibili comments BV1xx411c7mD --parent 123456789 --limit 10
opencli bilibili comment BV1xx411c7mD "这条评论来自 OpenCLI" --execute
```

## 前置条件

- Chrome 已启动，并已登录 Bilibili
- 已安装 [Browser Bridge 扩展](/zh/guide/browser-bridge)
- 如果要使用 bridge 后端，需要先安装底层 CLI：
  - `opencli external install bili`

## 说明

- `opencli bilibili ...` 是推荐的统一入口。
- `opencli bili ...` 仍然可用，但它是底层原始 passthrough 接口。
- `following` / `history` / `feed` 已支持 `--backend bridge`，优先使用这个 canonical 形式，而不是旧的 bridge 别名。
- `feed --backend bridge` 会保留 `next_offset`，因此更适合配合 `-f json` 使用。
- bridged feed 当前还不支持 `uid`、`type`、`pages`，需要用 `offset` 做翻页。
- `dynamic-post` 与 `dynamic-delete` 属于写命令，必须显式传 `--execute`。
