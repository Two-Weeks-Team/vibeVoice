import { test, expect } from '@playwright/test';

// Mock response for successful generation
const MOCK_AUDIO_URL = 'https://example.com/audio/test.mp3';
const MOCK_SUCCESS_RESPONSE = {
  audioUrl: MOCK_AUDIO_URL,
  traceId: 'trace-test-123',
  durationMs: 5000,
  usageCharacters: 11,
};

test.describe('VibeVoice Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const res = await page.request.post('/api/auth/login', {
      data: { password: process.env.AUTH_PASSWORD ?? '1234' },
    });
    const cookies = res.headers()['set-cookie'];
    if (cookies) {
      const match = cookies.match(/vv-session=([^;]+)/);
      if (match) {
        await page.context().addCookies([{
          name: 'vv-session',
          value: match[1],
          domain: 'localhost',
          path: '/',
        }]);
      }
    }
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('page loads without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('page shows VibeVoice heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('VibeVoice');
  });

  test('generate button is disabled when text is empty', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByTestId('generate-btn');
    await expect(btn).toBeDisabled();
  });

  test('char count updates in real-time', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('text-input').fill('hello world');
    await expect(page.getByTestId('char-count')).toContainText('11');
  });

  test('interjection buttons insert tags into the script', async ({ page }) => {
    await page.goto('/');
    const textarea = page.getByTestId('text-input');
    await textarea.fill('Hello world');
    await page.getByTestId('text-input').evaluate((element) => {
      const textareaElement = element as HTMLTextAreaElement;
      textareaElement.focus();
      textareaElement.setSelectionRange(5, 5);
    });
    await page.getByTestId('interjection-toggle').click();
    await page.getByTestId('interjection-btn-sighs').click();
    await expect(textarea).toHaveValue('Hello (sighs) world');
  });

  test('language boost selection is sent in the generation payload', async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;

    await page.route('/api/t2a', async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto('/');
    await page.getByTestId('language-boost-select').click();
    await page.getByRole('option', { name: 'Korean' }).click();
    await page.getByTestId('text-input').fill('안녕하세요. 테스트입니다.');
    await page.getByTestId('generate-btn').click();

    await expect(page.getByTestId('audio-player')).toBeVisible({ timeout: 10000 });
    expect(requestBody?.['languageBoost']).toBe('Korean');
  });

  test('generate button is enabled with valid text', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('text-input').fill('Hello, this is a test');
    await expect(page.getByTestId('generate-btn')).toBeEnabled();
  });

  test('emotion select does not have neutral option', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('emotion-select').click();
    await page.waitForTimeout(500);
    const options = await page
      .locator('[role="option"]')
      .allTextContents();
    const combined = options.join(' ').toLowerCase();
    expect(combined).not.toContain('neutral');
  });

  test('generate flow with mocked API — shows audio player', async ({
    page,
  }) => {
    await page.route('/api/t2a', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });
    await page.goto('/');
    await page.getByTestId('text-input').fill('Hello world test');
    await page.getByTestId('generate-btn').click();
    await expect(page.getByTestId('audio-player')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('download-btn')).toBeVisible();
  });

  test('generate flow — audio player has correct src', async ({ page }) => {
    await page.route('/api/t2a', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });
    await page.goto('/');
    await page.getByTestId('text-input').fill('Test audio generation');
    await page.getByTestId('generate-btn').click();
    const player = page.getByTestId('audio-player');
    await expect(player).toBeVisible({ timeout: 10000 });
    await expect(player.locator('audio')).toHaveAttribute('src', MOCK_AUDIO_URL);
  });

  test('history item added after generation', async ({ page }) => {
    await page.route('/api/t2a', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });
    await page.goto('/');
    await page.getByTestId('text-input').fill('Testing history');
    await page.getByTestId('generate-btn').click();
    await expect(page.getByTestId('audio-player')).toBeVisible({
      timeout: 10000,
    });
    const historyItems = page.locator('[data-testid^="history-item-"]');
    await expect(historyItems).toHaveCount(1, { timeout: 5000 });
  });

  test('history persists after page reload', async ({ page }) => {
    await page.route('/api/t2a', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });
    await page.goto('/');
    await page.getByTestId('text-input').fill('Persistence test');
    await page.getByTestId('generate-btn').click();
    await expect(
      page.locator('[data-testid^="history-item-"]')
    ).toHaveCount(1, { timeout: 10000 });
    // Route must be re-applied after reload since it's cleared
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid^="history-item-"]')
    ).toHaveCount(1, { timeout: 5000 });
  });

  test('error toast shown on API failure (rate limit)', async ({ page }) => {
    await page.route('/api/t2a', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please wait before retrying.',
        }),
      });
    });
    await page.goto('/');
    await page.getByTestId('text-input').fill('Rate limit test');
    await page.getByTestId('generate-btn').click();
    await expect(
      page.locator('[data-sonner-toast]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('clear history button removes all items', async ({ page }) => {
    // Inject history via localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const entry = {
        id: 'test-hist-1',
        text: 'Hello world test text',
        textPreview: 'Hello world test text',
        audioUrl: 'https://example.com/audio.mp3',
        traceId: 'trace-1',
        generatedAt: Date.now(),
        voiceSettings: {
          voiceId: 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67',
          speed: 1,
          vol: 1,
          pitch: 0,
        },
        audioSettings: { format: 'mp3' },
      };
      localStorage.setItem('vibeVoice:history', JSON.stringify([entry]));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid^="history-item-"]')
    ).toHaveCount(1, { timeout: 5000 });
    await page.getByTestId('clear-history-btn').click();
    await expect(page.getByTestId('history-empty')).toBeVisible({
      timeout: 5000,
    });
  });

  test('expired history items show expired badge', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const expiredEntry = {
        id: 'expired-1',
        text: 'Old text that has expired',
        textPreview: 'Old text that has expired',
        audioUrl: 'https://example.com/old.mp3',
        traceId: 'trace-old',
        generatedAt: Date.now() - 24 * 60 * 60 * 1000, // 24h ago (> 23h expiry)
        voiceSettings: {
          voiceId: 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67',
          speed: 1,
          vol: 1,
          pitch: 0,
        },
        audioSettings: { format: 'mp3' },
      };
      localStorage.setItem(
        'vibeVoice:history',
        JSON.stringify([expiredEntry])
      );
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('expired-badge')).toBeVisible({
      timeout: 5000,
    });
  });

  test('empty history shows empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('history-empty')).toBeVisible({
      timeout: 5000,
    });
  });
});
