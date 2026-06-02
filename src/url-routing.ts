import { ArgumentError } from './errors.js';

export interface RoutedUrlCommand {
  site: string;
  command: string;
  argv: string[];
  reason: string;
}

export interface RoutedUrlCandidate extends RoutedUrlCommand {
  confidence: 'high' | 'medium';
}

function parseUrl(raw: string): URL {
  try {
    return new URL(raw);
  } catch {
    throw new ArgumentError(`Invalid URL: ${raw}`, 'Pass a full http(s) URL to opencli open');
  }
}

function hostnameMatches(hostname: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

export function routeUrlToCommand(rawUrl: string): RoutedUrlCommand {
  const candidates = matchUrlToCommands(rawUrl);
  if (candidates.length === 0) {
    const url = parseUrl(rawUrl);
    throw new ArgumentError(
      `No built-in URL route for host ${url.hostname.toLowerCase()}`,
      'Try the site-specific command directly, or extend opencli open routing rules for this host.',
    );
  }
  return candidates[0];
}

export function selectUrlRouteCandidate(
  rawUrl: string,
  opts: { index?: number } = {},
): RoutedUrlCandidate {
  const candidates = matchUrlToCommands(rawUrl);
  return chooseUrlRouteCandidate(candidates, opts);
}

export function chooseUrlRouteCandidate(
  candidates: RoutedUrlCandidate[],
  opts: { index?: number } = {},
): RoutedUrlCandidate {
  if (candidates.length === 0) {
    throw new ArgumentError(
      'No candidate routes available',
      'Try the site-specific command directly, or extend opencli open routing rules for this host.',
    );
  }
  if (opts.index === undefined) {
    if (candidates.length > 1) {
      throw new ArgumentError(
        `URL matched ${candidates.length} candidate commands`,
        'Use --candidates to inspect them, then re-run with --choose <index> to select one explicitly.',
      );
    }
    return candidates[0];
  }
  if (!Number.isInteger(opts.index) || opts.index < 1 || opts.index > candidates.length) {
    throw new ArgumentError(
      `--choose must be between 1 and ${candidates.length}`,
      'Run with --candidates first to inspect valid route indexes.',
    );
  }
  return candidates[opts.index - 1];
}

export function matchUrlToCommands(rawUrl: string): RoutedUrlCandidate[] {
  const url = parseUrl(rawUrl);
  const hostname = url.hostname.toLowerCase();
  const href = url.toString();
  const candidates: RoutedUrlCandidate[] = [];

  if (hostname === 'mp.weixin.qq.com') {
    candidates.push({
      site: 'weixin',
      command: 'download',
      argv: ['--url', href],
      reason: 'WeChat Official Account article URL',
      confidence: 'high',
    });
  }

  if (hostnameMatches(hostname, ['feishu.cn', 'larksuite.com'])) {
    candidates.push({
      site: 'feishu',
      command: 'doc',
      argv: ['--url', href],
      reason: 'Feishu / Lark document URL',
      confidence: 'high',
    });
  }

  if (hostname === 'wx.zsxq.com') {
    const topicMatch = url.pathname.match(/\/topic\/(\d+)/i);
    if (topicMatch) {
      candidates.push({
        site: 'zsxq',
        command: 'download',
        argv: [href],
        reason: 'ZSXQ topic URL',
        confidence: 'high',
      });
    }
  }

  if (hostname === 'zhuanlan.zhihu.com') {
    candidates.push({
      site: 'zhihu',
      command: 'download',
      argv: ['--url', href],
      reason: 'Zhihu article URL',
      confidence: 'high',
    });
  }

  if (hostname === 'www.reuters.com' || hostname === 'reuters.com') {
    candidates.push({
      site: 'reuters',
      command: 'article-detail',
      argv: [href],
      reason: 'Reuters article URL',
      confidence: 'high',
    });
  }

  if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'youtu.be') {
    candidates.push({
      site: 'youtube',
      command: 'video',
      argv: [href],
      reason: 'YouTube video URL',
      confidence: 'high',
    });
  }

  if (hostname === 'www.bilibili.com' || hostname === 'b23.tv' || hostname === 'm.bilibili.com') {
    candidates.push({
      site: 'bilibili',
      command: 'video',
      argv: [href],
      reason: 'Bilibili video URL',
      confidence: 'high',
    });
  }

  if (hostname === 'pan.quark.cn') {
    candidates.push({
      site: 'quark',
      command: 'share-tree',
      argv: [href],
      reason: 'Quark share URL',
      confidence: 'high',
    });
  }

  if (hostname === 'movie.douban.com' || hostname === 'book.douban.com') {
    const subjectMatch = url.pathname.match(/\/subject\/(\d+)\/?/i);
    if (subjectMatch) {
      candidates.push({
        site: 'douban',
        command: 'subject',
        argv: [subjectMatch[1], '--type', hostname === 'book.douban.com' ? 'book' : 'movie'],
        reason: 'Douban subject detail URL',
        confidence: 'high',
      });
    }
  }

  if (hostname === 'm.okjike.com') {
    const postMatch = url.pathname.match(/\/originalPosts\/([^/?#]+)/i);
    if (postMatch) {
      candidates.push({
        site: 'jike',
        command: 'post',
        argv: [postMatch[1]],
        reason: 'Jike post detail URL',
        confidence: 'high',
      });
    }
  }
  return candidates;
}
