import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/t2a/route';
import { NextRequest } from 'next/server';

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/t2a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Helper to get response body
async function getBody(req: NextRequest) {
  const res = await POST(req);
  const json = await res.json();
  return { status: res.status, body: json };
}

describe('POST /api/t2a', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('MINIMAX_API_KEY', 'test-api-key');
    vi.stubEnv('MINIMAX_GROUP_ID', '');
    vi.unstubAllGlobals();
  });

  // Input validation
  it('returns 400 when text is missing', async () => {
    const { status, body } = await getBody(createRequest({}));
    expect(status).toBe(400);
    expect(body.error).toContain('text');
  });

  it('returns 400 when text is empty string', async () => {
    const { status, body } = await getBody(createRequest({ text: '' }));
    expect(status).toBe(400);
    expect(body.error).toContain('text');
  });

  it('returns 400 when text exceeds 10000 chars', async () => {
    const { status, body } = await getBody(createRequest({ text: 'a'.repeat(10001) }));
    expect(status).toBe(400);
    expect(body.error).toContain('10,000');
  });

  it('returns 400 when vol is 0', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', vol: 0 }));
    expect(status).toBe(400);
    expect(body.error).toContain('vol');
  });

  it('returns 400 when vol exceeds 10', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', vol: 10.1 }));
    expect(status).toBe(400);
    expect(body.error).toContain('vol');
  });

  it('returns 400 when speed is below 0.5', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', speed: 0.4 }));
    expect(status).toBe(400);
    expect(body.error).toContain('speed');
  });

  it('returns 400 when speed exceeds 2', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', speed: 2.1 }));
    expect(status).toBe(400);
    expect(body.error).toContain('speed');
  });

  it('returns 400 when pitch is above 12', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', pitch: 13 }));
    expect(status).toBe(400);
    expect(body.error).toContain('pitch');
  });

  it('returns 400 when pitch is below -12', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', pitch: -13 }));
    expect(status).toBe(400);
    expect(body.error).toContain('pitch');
  });

  it('returns 400 when emotion is "neutral"', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', emotion: 'neutral' }));
    expect(status).toBe(400);
    expect(body.error).toContain('emotion');
  });

  it('returns 400 when format is "ogg"', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', format: 'ogg' }));
    expect(status).toBe(400);
    expect(body.error).toContain('format');
  });

  it('returns 400 when languageBoost is invalid', async () => {
    const { status, body } = await getBody(createRequest({ text: 'hi', languageBoost: 'Klingon' }));
    expect(status).toBe(400);
    expect(body.error).toContain('languageBoost');
  });

  it('returns 500 when MINIMAX_API_KEY is missing', async () => {
    vi.unstubAllEnvs();
    // No API key set
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(500);
    expect(body.error).toContain('configuration');
  });

  // MiniMax API error responses
  it('returns 429 when MiniMax returns status_code 1002 (rate limit)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 1002, status_msg: 'rate limit' },
        data: null,
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(429);
    expect(body.error).toContain('Rate limit');
  });

  it('returns 401 when MiniMax returns status_code 1004 (auth failed)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 1004, status_msg: 'auth failed' },
        data: null,
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(401);
    expect(body.error).toContain('authentication');
  });

  it('returns 402 when MiniMax returns status_code 1008 (insufficient balance)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 1008, status_msg: 'insufficient balance' },
        data: null,
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(402);
    expect(body.error).toContain('balance');
  });

  it('returns 400 when MiniMax returns status_code 1042 (special chars)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 1042, status_msg: 'invisible chars' },
        data: null,
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(400);
    expect(body.error).toContain('special characters');
  });

  it('returns 500 when MiniMax returns data: null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 0, status_msg: 'success' },
        data: null,
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(500);
    expect(body.error).toContain('No audio');
  });

  it('returns 502 when fetch to MiniMax fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const { status, body } = await getBody(createRequest({ text: 'hello' }));
    expect(status).toBe(502);
    expect(body.error).toContain('connect');
  });

  it('returns 200 with audioUrl on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 0, status_msg: 'success' },
        data: { audio: 'https://cdn.minimax.io/audio/test.mp3', status: 2 },
        trace_id: 'trace-123',
        extra_info: { audio_length: 5000, usage_characters: 10 },
      }),
    }));
    const { status, body } = await getBody(createRequest({ text: 'hello world' }));
    expect(status).toBe(200);
    expect(body.audioUrl).toBe('https://cdn.minimax.io/audio/test.mp3');
    expect(body.traceId).toBe('trace-123');
    expect(body.durationMs).toBe(5000);
    expect(body.usageCharacters).toBe(10);
  });

  it('passes language_boost through to MiniMax when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        base_resp: { status_code: 0, status_msg: 'success' },
        data: { audio: 'https://cdn.minimax.io/audio/test.mp3', status: 2 },
        trace_id: 'trace-123',
        extra_info: { audio_length: 5000, usage_characters: 10 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { status } = await getBody(createRequest({ text: 'hello world', languageBoost: 'Korean' }));

    expect(status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit.body)) as { language_boost?: string };
    expect(payload.language_boost).toBe('Korean');
  });
});
