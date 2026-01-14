import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIProvider, type AIConfig } from '../../types';

describe('AIService', () => {
  const baseConfig: AIConfig = {
    provider: AIProvider.SILICONFLOW,
    apiKey: 'k',
    baseUrl: 'http://example.com/v1',
    model: 'm',
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('缺少 API Key 时应抛出 MISSING_API_KEY', async () => {
    const { AIService } = await import('../aiService');
    const service = new AIService({ ...baseConfig, apiKey: '' });
    await expect(service.generateExplanation('p', 'c')).rejects.toThrow('MISSING_API_KEY');
  });

  it('OpenAI-compatible ok 响应应返回 message.content', async () => {
    const { AIService } = await import('../aiService');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    } as any);

    const service = new AIService(baseConfig);
    const text = await service.generateExplanation('p', 'c');
    expect(text).toBe('hello');
  });

  it('OpenAI-compatible 非 ok 应返回失败文案', async () => {
    const { AIService } = await import('../aiService');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'nope',
    } as any);

    const service = new AIService(baseConfig);
    const text = await service.generateExplanation('p', 'c');
    expect(text).toContain('AI 调用失败');
    expect(text).toContain('401');
  });

  it('Gemini 分支应返回 SDK 文本', async () => {
    const { AIService } = await import('../aiService');
    vi.spyOn(AIService.prototype as any, 'callGemini').mockResolvedValue('ok');
    const service = new AIService({ ...baseConfig, provider: AIProvider.GEMINI, baseUrl: '' });
    const text = await service.generateExplanation('p', 'c');
    expect(text).toBe('ok');
  });
});
