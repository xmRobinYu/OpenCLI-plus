import { describe, expect, it, vi } from 'vitest';
import { ArgumentError } from './errors.js';
import * as routing from './url-routing.js';
import type { RoutedUrlCandidate } from './url-routing.js';

describe('routeUrlToCommand', () => {
  it('routes Feishu document URLs to feishu/doc', () => {
    expect(routing.routeUrlToCommand('https://team.feishu.cn/docx/abc')).toMatchObject({
      site: 'feishu',
      command: 'doc',
      argv: ['--url', 'https://team.feishu.cn/docx/abc'],
    });
  });

  it('routes ZSXQ topic URLs to zsxq/download', () => {
    expect(routing.routeUrlToCommand('https://wx.zsxq.com/topic/123456789')).toMatchObject({
      site: 'zsxq',
      command: 'download',
      argv: ['https://wx.zsxq.com/topic/123456789'],
    });
  });

  it('routes WeChat article URLs to weixin/download', () => {
    expect(routing.routeUrlToCommand('https://mp.weixin.qq.com/s/abc')).toMatchObject({
      site: 'weixin',
      command: 'download',
    });
  });

  it('routes Reuters article URLs to reuters/article-detail', () => {
    expect(routing.routeUrlToCommand('https://www.reuters.com/world/example-story/')).toMatchObject({
      site: 'reuters',
      command: 'article-detail',
    });
  });

  it('routes Bilibili video URLs to bilibili/video', () => {
    expect(routing.routeUrlToCommand('https://www.bilibili.com/video/BV1xx411c7mD')).toMatchObject({
      site: 'bilibili',
      command: 'video',
    });
  });

  it('routes YouTube watch URLs to youtube/video', () => {
    expect(routing.routeUrlToCommand('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toMatchObject({
      site: 'youtube',
      command: 'video',
    });
  });

  it('routes Douban subject URLs to douban/subject', () => {
    expect(routing.routeUrlToCommand('https://movie.douban.com/subject/30382501/')).toMatchObject({
      site: 'douban',
      command: 'subject',
      argv: ['30382501', '--type', 'movie'],
    });
  });

  it('routes Jike post URLs to jike/post', () => {
    expect(routing.routeUrlToCommand('https://m.okjike.com/originalPosts/66f0abc123')).toMatchObject({
      site: 'jike',
      command: 'post',
      argv: ['66f0abc123'],
    });
  });

  it('rejects unsupported hosts', () => {
    expect(() => routing.routeUrlToCommand('https://example.com/path')).toThrow(ArgumentError);
  });

  it('returns candidate routes for a supported URL', () => {
    const candidates = routing.matchUrlToCommands('https://movie.douban.com/subject/30382501/');
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      site: 'douban',
      command: 'subject',
      confidence: 'high',
    });
  });

  it('requires explicit selection when multiple candidates exist', () => {
    const candidates: RoutedUrlCandidate[] = [
      { site: 'demo', command: 'one', argv: ['a'], reason: 'first', confidence: 'medium' },
      { site: 'demo', command: 'two', argv: ['b'], reason: 'second', confidence: 'medium' },
    ];
    expect(() => routing.chooseUrlRouteCandidate([...candidates])).toThrow(ArgumentError);
    expect(routing.chooseUrlRouteCandidate([...candidates], { index: 2 })).toMatchObject({
      command: 'two',
    });
  });
});
