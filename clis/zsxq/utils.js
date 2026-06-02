import { ArgumentError, AuthRequiredError, CliError } from '@jackwener/opencli/errors';
const SITE_DOMAIN = 'wx.zsxq.com';
const SITE_URL = 'https://wx.zsxq.com';
function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : null;
}
function pickArray(...values) {
    for (const value of values) {
        if (Array.isArray(value)) {
            return value;
        }
    }
    return [];
}
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function parseRichAttrs(raw) {
    const attrs = {};
    String(raw || '').replace(/([:@\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_match, key, dq, sq) => {
        attrs[String(key).toLowerCase()] = dq ?? sq ?? '';
        return '';
    });
    return attrs;
}
function decodeRichAttr(value) {
    if (typeof value !== 'string')
        return '';
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
function looksLikeBlockHtml(value) {
    return /<(?:p|div|section|article|ul|ol|li|h[1-6]|blockquote|pre|table|img)\b/i.test(value);
}
function normalizeParagraphHtml(value) {
    const normalized = String(value || '').replace(/\r\n?/g, '\n').trim();
    if (!normalized)
        return '';
    if (looksLikeBlockHtml(normalized))
        return normalized;
    return normalized
        .split(/\n{2,}/)
        .map(chunk => chunk.trim())
        .filter(Boolean)
        .map(chunk => `<p>${chunk.replace(/\n/g, '<br />')}</p>`)
        .join('\n');
}
function extractRichTextImageUrls(text) {
    const urls = [];
    String(text || '').replace(/<e\b([^>]*)>(.*?)<\/e>/gsi, (_match, attrsRaw) => {
        const attrs = parseRichAttrs(attrsRaw);
        if (String(attrs.type || '').toLowerCase() === 'image' && attrs.src) {
            urls.push(decodeRichAttr(attrs.src));
        }
        return '';
    });
    return urls.filter(Boolean);
}
function richTextToHtml(text) {
    if (typeof text !== 'string' || !text.trim())
        return '';
    const html = text.replace(/<e\b([^>]*)>(.*?)<\/e>/gsi, (_match, attrsRaw, innerText) => {
        const attrs = parseRichAttrs(attrsRaw);
        const type = String(attrs.type || '').toLowerCase();
        if (type === 'mention') {
            const title = decodeRichAttr(attrs.title || innerText || '');
            return escapeHtml(title ? `@${title}` : '@');
        }
        if (type === 'hashtag') {
            return escapeHtml(decodeRichAttr(attrs.title || innerText || ''));
        }
        if (type === 'web') {
            const href = decodeRichAttr(attrs.href || '');
            const title = decodeRichAttr(attrs.title || href || innerText || '');
            return href
                ? `<a href="${escapeHtml(href)}">${escapeHtml(title || href)}</a>`
                : escapeHtml(title);
        }
        if (type === 'image') {
            const src = decodeRichAttr(attrs.src || '');
            const alt = decodeRichAttr(attrs.title || '图片');
            return src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />` : '';
        }
        return escapeHtml(innerText || '');
    });
    const stripped = html
        .replace(/<\/?e\b[^>]*>/gsi, '')
        .replace(/<br\s*\/?>/gi, '\n');
    return normalizeParagraphHtml(stripped);
}
function dedupeStrings(values) {
    const seen = new Set();
    const result = [];
    for (const value of values) {
        const normalized = String(value || '').trim();
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        result.push(normalized);
    }
    return result;
}
function getPrimaryTopicBlock(topic) {
    return topic.talk || topic.question || topic.task || topic.solution || topic.answer || {};
}
function collectTopicImageUrls(topic) {
    const primary = getPrimaryTopicBlock(topic);
    const apiImages = pickArray(primary.images)
        .map((image) => image?.large?.url || image?.original?.url || image?.thumbnail?.url || image?.url || '')
        .filter(Boolean);
    const inlineImages = extractRichTextImageUrls(primary.text || '');
    if (topic.answer?.text) {
        inlineImages.push(...extractRichTextImageUrls(topic.answer.text));
    }
    return dedupeStrings([...apiImages, ...inlineImages]);
}
function getTopicTypeLabel(topicType) {
    const mapping = {
        talk: '帖子',
        'q&a': '问答',
        task: '作业',
        solution: '作业答案',
    };
    return mapping[topicType] || topicType || '话题';
}
function commentToHtml(comment) {
    const author = escapeHtml(comment?.owner?.name || '匿名');
    const repliee = comment?.repliee?.name ? ` 回复 ${escapeHtml(comment.repliee.name)}` : '';
    const body = richTextToHtml(comment?.text || '') || '<p></p>';
    return `<li><strong>${author}${repliee}</strong>${body}</li>`;
}
function buildAttachmentSection(files) {
    const items = pickArray(files)
        .map((file) => {
        const name = file?.name || file?.file_name || '附件';
        const url = file?.url || file?.download_url || '';
        return url
            ? `<li><a href="${escapeHtml(url)}">${escapeHtml(name)}</a></li>`
            : `<li>${escapeHtml(name)}</li>`;
    })
        .join('');
    return items ? `<h2>附件</h2><ul>${items}</ul>` : '';
}
export function parseTopicTarget(raw) {
    const value = String(raw || '').trim();
    if (!value) {
        throw new ArgumentError('Topic target is required', 'Pass a numeric topic id or a wx.zsxq.com/topic/<id> URL');
    }
    if (/^\d+$/.test(value)) {
        return { topicId: value };
    }
    const topicUrlMatch = value.match(/\/topic\/(\d+)/i);
    if (topicUrlMatch) {
        return { topicId: topicUrlMatch[1] };
    }
    throw new ArgumentError(`Unsupported topic target: ${value}`, 'Pass a numeric topic id or a wx.zsxq.com/topic/<id> URL');
}
export function topicToArticleData(topic, comments = [], sourceUrl = '') {
    const primary = getPrimaryTopicBlock(topic);
    const title = getTopicText(topic) || `zsxq-topic-${topic?.topic_id || 'untitled'}`;
    const bodyHtml = richTextToHtml(primary?.text || '');
    const extraImageHtml = pickArray(primary?.images)
        .map((image) => image?.large?.url || image?.original?.url || image?.thumbnail?.url || image?.url || '')
        .filter(Boolean)
        .map((url) => `<p><img src="${escapeHtml(url)}" alt="图片" /></p>`)
        .join('');
    const answerHtml = topic?.answer?.text ? `<h2>回答</h2>${richTextToHtml(topic.answer.text)}` : '';
    const attachmentsHtml = buildAttachmentSection(primary?.files);
    const commentsHtml = comments.length > 0 ? `<h2>评论</h2><ul>${comments.map(commentToHtml).join('')}</ul>` : '';
    const metricsHtml = `<blockquote><p>类型: ${escapeHtml(getTopicTypeLabel(topic?.type || ''))}</p><p>阅读: ${escapeHtml(topic?.readers_count ?? topic?.reading_count ?? 0)} / 点赞: ${escapeHtml(topic?.likes_count ?? 0)} / 评论: ${escapeHtml(topic?.comments_count ?? comments.length ?? 0)}</p></blockquote>`;
    return {
        title,
        author: getTopicAuthor(topic) || primary?.owner?.name || '',
        publishTime: String(topic?.create_time || '').replace('T', ' ').replace(/\.\d+Z$/, '').trim(),
        sourceUrl,
        contentHtml: [metricsHtml, bodyHtml, extraImageHtml, attachmentsHtml, answerHtml, commentsHtml].filter(Boolean).join('\n'),
        imageUrls: collectTopicImageUrls(topic),
    };
}
export async function ensureZsxqPage(page) {
    await page.goto(SITE_URL);
}
export async function ensureZsxqAuth(page) {
    // zsxq uses httpOnly cookies that may be on different subdomains.
    // Verify auth by attempting a lightweight API call instead of checking cookies.
    try {
        const result = await page.evaluate(`
      (async () => {
        try {
          const r = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://api.zsxq.com/v2/groups', true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('accept', 'application/json');
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)); }
                catch { resolve(null); }
              } else { resolve(null); }
            };
            xhr.onerror = () => resolve(null);
            xhr.send();
          });
          return r !== null;
        } catch { return false; }
      })()
    `);
        if (!result) {
            throw new AuthRequiredError('zsxq.com');
        }
    }
    catch (err) {
        if (err instanceof AuthRequiredError)
            throw err;
        throw new AuthRequiredError('zsxq.com');
    }
}
export async function getCookieValue(page, name) {
    const cookies = await page.getCookies({ domain: SITE_DOMAIN });
    return cookies.find(cookie => cookie.name === name)?.value;
}
export async function getActiveGroupId(page) {
    const groupId = await page.evaluate(`
    (() => {
      const target = localStorage.getItem('target_group');
      if (target) {
        try {
          const parsed = JSON.parse(target);
          if (parsed.group_id) return String(parsed.group_id);
        } catch {}
      }
      return null;
    })()
  `);
    if (groupId)
        return groupId;
    throw new ArgumentError('Cannot determine active group_id', 'Pass --group_id <id> or open the target 知识星球 page in Chrome first');
}
export async function browserJsonRequest(page, path) {
    return await page.evaluate(`
    (async () => {
      const path = ${JSON.stringify(path)};

      try {
        return await new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', path, true);
          xhr.withCredentials = true;
          xhr.setRequestHeader('accept', 'application/json, text/plain, */*');
          xhr.onload = () => {
            let parsed = null;
            if (xhr.responseText) {
              try { parsed = JSON.parse(xhr.responseText); }
              catch {}
            }

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              url: path,
              status: xhr.status,
              data: parsed,
              error: xhr.status >= 200 && xhr.status < 300 ? undefined : 'HTTP ' + xhr.status,
            });
          };
          xhr.onerror = () => resolve({
            ok: false,
            url: path,
            error: 'Network error',
          });
          xhr.send();
        });
      } catch (error) {
        return {
          ok: false,
          url: path,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })()
  `);
}
export async function fetchFirstJson(page, paths) {
    let lastFailure = null;
    for (const path of paths) {
        const result = await browserJsonRequest(page, path);
        if (result.ok) {
            return result;
        }
        lastFailure = result;
    }
    if (!lastFailure) {
        throw new CliError('FETCH_ERROR', 'No candidate endpoint returned JSON', `Checked endpoints: ${paths.join(', ')}`);
    }
    throw new CliError('FETCH_ERROR', lastFailure.error || 'Failed to fetch ZSXQ API', `Checked endpoints: ${paths.join(', ')}`);
}
export function unwrapRespData(payload) {
    const record = asRecord(payload);
    if (!record) {
        throw new CliError('PARSE_ERROR', 'Invalid ZSXQ API response');
    }
    if (record.succeeded === false) {
        const code = typeof record.code === 'number' ? String(record.code) : 'API_ERROR';
        const message = typeof record.info === 'string'
            ? record.info
            : typeof record.error === 'string'
                ? record.error
                : 'ZSXQ API returned an error';
        throw new CliError(code, message);
    }
    return (record.resp_data ?? record.data ?? payload);
}
export function getTopicsFromResponse(payload) {
    const data = unwrapRespData(payload);
    if (Array.isArray(data))
        return data;
    return pickArray(data.topics, data.list, data.records, data.items, data.search_result);
}
export function getCommentsFromResponse(payload) {
    const data = unwrapRespData(payload);
    if (Array.isArray(data))
        return data;
    return pickArray(data.comments, data.list, data.items);
}
export function getGroupsFromResponse(payload) {
    const data = unwrapRespData(payload);
    if (Array.isArray(data))
        return data;
    return pickArray(data.groups, data.list, data.items);
}
export function getTopicFromResponse(payload) {
    const data = unwrapRespData(payload);
    if (Array.isArray(data))
        return data[0] ?? null;
    if (typeof data.topic_id === 'number' || typeof data.topic_id === 'string')
        return data;
    const record = asRecord(data);
    if (!record)
        return null;
    const topic = record.topic;
    return topic && typeof topic === 'object' ? topic : null;
}
export function getTopicAuthor(topic) {
    return (topic.owner?.name ||
        topic.talk?.owner?.name ||
        topic.question?.owner?.name ||
        topic.answer?.owner?.name ||
        topic.task?.owner?.name ||
        topic.solution?.owner?.name ||
        '');
}
export function getTopicText(topic) {
    const title = (topic.title || '').replace(/\s+/g, ' ').trim();
    return title || getTopicContent(topic);
}
export function getTopicContent(topic) {
    const primary = [
        topic.talk?.text,
        topic.question?.text,
        topic.answer?.text,
        topic.task?.text,
        topic.solution?.text,
    ].find(value => typeof value === 'string' && value.trim());
    return (primary || '').replace(/\s+/g, ' ').trim();
}
export function getTopicUrl(topicId) {
    return topicId ? `${SITE_URL}/topic/${topicId}` : SITE_URL;
}
export function summarizeComments(comments, limit = 3) {
    return comments
        .slice(0, limit)
        .map((comment) => {
        const author = comment.owner?.name || '匿名';
        const target = comment.repliee?.name ? ` -> ${comment.repliee.name}` : '';
        const text = (comment.text || '').replace(/\s+/g, ' ').trim();
        return `${author}${target}: ${text}`;
    })
        .join(' | ');
}
export function toTopicRow(topic) {
    const topicId = topic.topic_id ?? '';
    const comments = pickArray(topic.show_comments, topic.comments);
    return {
        topic_id: topicId,
        type: topic.type || '',
        group: topic.group?.name || '',
        author: getTopicAuthor(topic),
        title: getTopicText(topic),
        content: getTopicContent(topic),
        comments: topic.comments_count ?? comments.length ?? 0,
        likes: topic.likes_count ?? 0,
        readers: topic.readers_count ?? topic.reading_count ?? 0,
        time: topic.create_time || '',
        comment_preview: summarizeComments(comments),
        url: getTopicUrl(topicId),
    };
}
