# 知识星球 (ZSXQ)

**Mode**: 🔐 Browser · **Domain**: `wx.zsxq.com`

Read groups, topics, search results, dynamics, and single-topic details from [知识星球](https://wx.zsxq.com) using your logged-in Chrome session.

## Commands

| Command | Description |
|---------|-------------|
| `opencli zsxq groups` | List the groups your account has joined |
| `opencli zsxq topics` | List topics in the active group |
| `opencli zsxq topic <id>` | Fetch a single topic with comments |
| `opencli zsxq search <keyword>` | Search topics inside a group |
| `opencli zsxq dynamics` | List recent dynamics across groups |
| `opencli zsxq status` | Check current login status via `zsxq-cli auth status` |
| `opencli zsxq user` | Read current user profile via `zsxq-cli user +info` |
| `opencli zsxq footprints` | Read cross-group posting footprints via `zsxq-cli user +footprints` |
| `opencli zsxq download <target>` | Export one topic to Markdown with comments and images |

## Usage Examples

```bash
# List your groups
opencli zsxq groups

# List topics from the active group in Chrome
opencli zsxq topics --limit 20

# Search inside the active group
opencli zsxq search "opencli"

# Search inside a specific group explicitly
opencli zsxq search "opencli" --group_id 123456789

# Check login status / current user profile via zsxq-cli bridge
opencli zsxq status
opencli zsxq user

# Read my cross-group posting footprints
opencli zsxq footprints --limit 20

# Export a single topic with comments
opencli zsxq topic 987654321 --comment_limit 20

# Read recent dynamics across all joined groups
opencli zsxq dynamics --limit 20

# Export a topic to Markdown by topic id
opencli zsxq download 987654321 --output ./zsxq

# Export a topic directly from its wx.zsxq.com URL
opencli zsxq download "https://wx.zsxq.com/topic/987654321" --output ./zsxq
```

## Prerequisites

- Chrome running and **logged into** [wx.zsxq.com](https://wx.zsxq.com)
- [Browser Bridge extension](/guide/browser-bridge) installed

## Notes

- `zsxq topics` and `zsxq search` use the current active group context from Chrome by default
- If there is no active group context, pass `--group_id <id>` or open the target group in Chrome first
- `zsxq groups` returns `group_id`, which you can reuse with `--group_id`
- `zsxq topic` surfaces a missing topic as `NOT_FOUND` instead of a generic fetch error
- `zsxq download` uses the topic detail API directly, so it works with a bare `topic_id` and does not require `--group_id`
- Markdown export writes to `<output>/<topic-title>/<topic-title>.md`; `--stdout` prints the markdown body directly for piping
- `zsxq status`, `user`, and `footprints` are bridged through the official `zsxq-cli`; install it with `opencli external install zsxq-cli`
