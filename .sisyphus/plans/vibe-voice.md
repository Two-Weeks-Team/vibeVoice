# VibeVoice — MiniMax T2A Dashboard

## TL;DR
> **Summary**: Next.js 풀스택 대시보드 앱. MiniMax T2A API를 통해 클론된 음성으로 텍스트를 오디오로 변환, 재생, 다운로드. 음성 설정(속도/음높이/볼륨/감정) 조절 및 생성 히스토리 관리.
> **Deliverables**: 완전한 Next.js 앱 (API route + 대시보드 UI + 테스트)
> **Effort**: Medium
> **Parallel**: YES — 5 waves
> **Critical Path**: Task 1 (scaffold) → Tasks 2-4 (API/types/hooks) → Tasks 5-8 (UI components) → Task 9 (integration) → Tasks 10-11 (E2E/polish)

## Context

### Original Request
MiniMax T2A API를 사용하여 클론된 음성(voice_id: `moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67`)으로 텍스트를 오디오로 변환하고, 재생 및 다운로드할 수 있는 웹 앱 구축.

### Interview Summary
- **Tech Stack**: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui
- **UI Level**: 풀 대시보드 (음성 설정, 히스토리, 포맷 선택 등)
- **Audio Mode**: Non-streaming + `output_format: 'url'` (24시간 유효 CDN 링크)
- **Model**: `speech-2.8-hd` (최신 HD 모델)
- **History**: localStorage 기반 (DB 없음)

### Metis Review (gaps addressed)
1. **`data.data` null 가능성** → API route에서 null-check 필수 (크래시 방지)
2. **emotion 목록 오류** → `neutral` 존재하지 않음, 올바른 9개: happy/sad/angry/fearful/disgusted/surprised/calm/fluent/whisper
3. **vol 최솟값 0.1** → 0은 API 에러, 슬라이더 min=0.1
4. **GroupId 필요 가능성** → `MINIMAX_GROUP_ID` optional env var로 대비
5. **CDN URL 만료** → 23시간 임계값, 히스토리에 "Expired" 배지 표시
6. **localStorage SSR** → `useEffect` + `mounted` 가드 패턴 필수
7. **Vercel timeout** → `export const maxDuration = 30` in API route
8. **invisible_character_ratio** → 10% 초과 시 에러 1042, 사용자에게 명확한 메시지
9. **Double-submit** → isLoading 중 버튼 비활성화

## Work Objectives

### Core Objective
MiniMax T2A API를 활용한 텍스트-투-오디오 웹 대시보드. 텍스트 입력 → 음성 설정 조절 → 오디오 생성 → 재생/다운로드의 완전한 워크플로우.

### Deliverables
- Next.js 앱 (TypeScript, App Router)
- `/api/t2a` 프록시 API Route (API 키 숨김)
- 대시보드 UI: 텍스트 입력, 음성 설정, 오디오 플레이어, 히스토리
- Unit 테스트 (Vitest) + E2E 테스트 (Playwright)
- README 문서

### Definition of Done (verifiable conditions with commands)
```bash
npx vitest run                    # All unit tests pass
npx playwright test               # All E2E tests pass
npx tsc --noEmit                  # Zero TypeScript errors
npx next build                    # Build succeeds
npx next lint                     # Zero lint errors
```

### Must Have
- 텍스트 입력 영역 (문자 수 카운트, 최대 10,000자)
- 음성 설정: speed (0.5-2), vol (0.1-10), pitch (-12~12), emotion 드롭다운 (9개 옵션)
- 오디오 포맷 선택: mp3/wav/flac
- Generate 버튼 (로딩 상태)
- 오디오 플레이어 (native `<audio controls>`)
- 다운로드 버튼
- 생성 히스토리 (localStorage, 최근 50개)
- 만료 CDN URL 감지 (23시간 임계값, "Expired" 배지)
- 에러 토스트 (sonner)
- `/api/t2a` 프록시 route (API 키 숨김)
- 입력 검증 (text 필수, 길이, vol 범위, speed 범위 등)
- MiniMax 에러 코드 매핑 (1002→429, 1004→401, 1042→특수문자 메시지 등)

### Must NOT Have (guardrails, scope boundaries)
- `voice_modify` UI (pitch/intensity/timbre/sound_effects 조절)
- `pronunciation_dict` UI (발음 사전)
- `subtitle_enable` / 자막 기능
- 음성 복제(Voice Cloning) UI — 이미 복제 완료
- 사용자 인증(auth)
- 데이터베이스 (Postgres, SQLite 등)
- 스트리밍 모드
- 여러 voice ID / voice selector
- 서버 사이드 rate limiting
- 오디오 파형(waveform) 시각화
- 배치 생성
- `language_boost` UI (hardcode `auto`)
- 커스텀 오디오 플레이어 (seek bar 등) — native `<audio controls>` 사용
- `sample_rate`, `bitrate`, `channel` 사용자 노출

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- **Test Decision**: TDD (RED-GREEN-REFACTOR) for API route and hooks; Tests-after for UI components
- **Unit Tests**: Vitest + React Testing Library + jsdom
- **E2E Tests**: Playwright (Chromium)
- **QA Policy**: Every task has agent-executed scenarios (happy + failure)
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1** (Foundation): Task 1 — Project scaffold
**Wave 2** (Core Logic, 3 parallel): Task 2 (API route TDD) | Task 3 (types/constants) | Task 4 (useLocalStorage hook)
**Wave 3** (UI Components, 4 parallel): Task 5 (TextInputPanel) | Task 6 (VoiceSettingsPanel) | Task 7 (AudioPlayer) | Task 8 (GenerationHistory)
**Wave 4** (Integration): Task 9 — Main page integration
**Wave 5** (Quality, 2 parallel): Task 10 (E2E tests) | Task 11 (Polish + README)

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1. Scaffold | — | 2, 3, 4 |
| 2. API Route | 1 | 9 |
| 3. Types/Constants | 1 | 2, 4, 5, 6, 7, 8, 9 |
| 4. useLocalStorage | 1, 3 | 8, 9 |
| 5. TextInputPanel | 1, 3 | 9 |
| 6. VoiceSettingsPanel | 1, 3 | 9 |
| 7. AudioPlayer | 1, 3 | 9 |
| 8. GenerationHistory | 1, 3, 4 | 9 |
| 9. Integration | 2, 3, 4, 5, 6, 7, 8 | 10 |
| 10. E2E Tests | 9 | F1-F4 |
| 11. Polish + README | 9 | F1-F4 |
| F1-F4. Verification | 10, 11 | — |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 1 task | quick |
| 2 | 3 tasks | deep, quick, deep |
| 3 | 4 tasks | visual-engineering ×4 |
| 4 | 1 task | visual-engineering |
| 5 | 2 tasks | deep, writing |
| Final | 4 tasks | oracle, unspecified-high ×2, deep |

## TODOs

- [x] 1. Project Scaffold — Next.js + Tailwind + shadcn/ui + Test Infra

  **What to do**:
  1. Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --no-git` in the project root (`/Users/sgwannabe/2026/vibeVoice`)
  2. Initialize shadcn/ui: `npx shadcn@latest init` (select default theme, CSS variables YES)
  3. Add shadcn components: `npx shadcn@latest add slider select card scroll-area badge button textarea label separator`
  4. Add sonner toast: `npx shadcn@latest add sonner`
  5. Install test dependencies: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  6. Install Playwright: `npm install -D @playwright/test && npx playwright install --with-deps chromium`
  7. Create `vitest.config.ts`:
     ```typescript
     import { defineConfig } from 'vitest/config';
     import react from '@vitejs/plugin-react';
     import path from 'path';
     export default defineConfig({
       plugins: [react()],
       test: {
         environment: 'jsdom',
         setupFiles: ['./vitest.setup.ts'],
         globals: true,
       },
       resolve: {
         alias: { '@': path.resolve(__dirname, './src') },
       },
     });
     ```
  8. Create `vitest.setup.ts`:
     ```typescript
     import '@testing-library/jest-dom/vitest';
     ```
  9. Create `playwright.config.ts`:
     ```typescript
     import { defineConfig, devices } from '@playwright/test';
     export default defineConfig({
       testDir: './e2e',
       fullyParallel: true,
       forbidOnly: !!process.env.CI,
       retries: process.env.CI ? 2 : 0,
       webServer: {
         command: 'npm run dev',
         url: 'http://localhost:3000',
         reuseExistingServer: !process.env.CI,
       },
       use: {
         baseURL: 'http://localhost:3000',
       },
       projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
     });
     ```
  10. Create `.env.local.example`:
      ```
      MINIMAX_API_KEY=your_api_key_here
      MINIMAX_GROUP_ID=your_group_id_here
      ```
  11. Create `.env.local` with actual values:
      ```
      MINIMAX_API_KEY=sk-api-b99aKsgVcqLetakiP1yQRlf58l2GP7HYQE0JtOFLI5T9It7qRVmbz-i5kAjvd_3BrD_BzXhiCWmN_BzqsdR9UDV7aJtAGQr5g9LJwU-akSS35IT6pAR0Rqk
      MINIMAX_GROUP_ID=
      ```
  12. Verify `.gitignore` includes `.env.local`
  13. Create `e2e/` directory (empty, for Playwright tests)
  14. Add test scripts to `package.json`:
      ```json
      "scripts": {
        "test": "vitest run",
        "test:watch": "vitest",
        "test:e2e": "playwright test",
        "test:e2e:ui": "playwright test --ui"
      }
      ```
  15. Clear default Next.js boilerplate from `src/app/page.tsx` (replace with minimal placeholder) and clean `src/app/globals.css` (keep Tailwind directives only)

  **Must NOT do**:
  - Do NOT initialize git (no --git flag, user will manage)
  - Do NOT install any database packages
  - Do NOT add `NEXT_PUBLIC_` prefix to API key env var
  - Do NOT use Pages Router (use App Router only)

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Straightforward scaffold commands, no complex logic
  - Skills: [] — No special skills needed
  - Omitted: [`frontend-ui-ux`] — No design work yet

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2, 3, 4] | Blocked By: []

  **References**:
  - External: https://nextjs.org/docs/getting-started/installation — Next.js create-next-app docs
  - External: https://ui.shadcn.com/docs/installation/next — shadcn/ui Next.js installation
  - External: https://vitest.dev/config/ — Vitest configuration

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] `npx next build` exits with code 0
  - [ ] `npx vitest run` exits with code 0 (no tests yet, 0 test suites)
  - [ ] `.env.local.example` exists with MINIMAX_API_KEY and MINIMAX_GROUP_ID
  - [ ] `.env.local` exists with actual API key value
  - [ ] `src/app/page.tsx` does NOT contain Next.js default boilerplate
  - [ ] `package.json` contains "test", "test:watch", "test:e2e" scripts
  - [ ] `node_modules/@playwright/test` exists
  - [ ] `node_modules/vitest` exists
  - [ ] shadcn components exist in `src/components/ui/` (slider.tsx, select.tsx, card.tsx, etc.)

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Build succeeds with clean scaffold
    Tool: Bash
    Steps: cd project root && npx next build
    Expected: Exit code 0, no errors in output
    Evidence: .sisyphus/evidence/task-1-scaffold-build.txt

  Scenario: TypeScript compilation passes
    Tool: Bash
    Steps: npx tsc --noEmit
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-1-scaffold-tsc.txt

  Scenario: shadcn components installed
    Tool: Bash
    Steps: ls src/components/ui/
    Expected: slider.tsx, select.tsx, card.tsx, scroll-area.tsx, badge.tsx, button.tsx, textarea.tsx, label.tsx, separator.tsx exist
    Evidence: .sisyphus/evidence/task-1-scaffold-shadcn.txt
  ```

  **Commit**: YES | Message: `feat: scaffold Next.js project with TypeScript, Tailwind, shadcn/ui, Vitest, Playwright` | Files: [all scaffold files]

- [x] 2. API Route `/api/t2a` — MiniMax Proxy with Validation (TDD)

  **What to do**:
  1. **Write tests FIRST** in `src/__tests__/api/t2a.test.ts`:
     - Mock `global.fetch` to simulate MiniMax API responses
     - Test: missing `text` field → 400 `{ error: "text is required" }`
     - Test: `text.length > 10000` → 400 `{ error: "Text exceeds 10,000 character limit" }`
     - Test: `text` empty string → 400 `{ error: "text is required" }`
     - Test: `vol = 0` → 400 `{ error: "vol must be between 0.1 and 10" }`
     - Test: `vol = 10.1` → 400
     - Test: `speed = 0.4` → 400 `{ error: "speed must be between 0.5 and 2" }`
     - Test: `speed = 2.1` → 400
     - Test: `pitch = 13` → 400 `{ error: "pitch must be between -12 and 12" }`
     - Test: `pitch = -13` → 400
     - Test: `emotion = "neutral"` → 400 `{ error: "Invalid emotion. Valid: happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper" }`
     - Test: `format = "ogg"` → 400 `{ error: "Invalid format. Valid: mp3, wav, flac" }`
     - Test: MiniMax returns `status_code: 1002` → 429 `{ error: "Rate limit exceeded..." }`
     - Test: MiniMax returns `status_code: 1004` → 401 `{ error: "API authentication failed..." }`
     - Test: MiniMax returns `status_code: 1008` → 402 `{ error: "Insufficient API balance." }`
     - Test: MiniMax returns `status_code: 1042` → 400 `{ error: "Input contains too many special characters." }`
     - Test: MiniMax returns `data: null` → 500 `{ error: "No audio data returned from MiniMax" }`
     - Test: MiniMax returns `status_code: 0`, `data.audio = "https://cdn..."` → 200 `{ audioUrl, traceId, durationMs, usageCharacters }`
     - Test: Missing `MINIMAX_API_KEY` env → 500 `{ error: "Server configuration error" }`
     - Test: Default values applied when optional fields omitted (speed=1, vol=1, pitch=0, emotion omitted, format=mp3)

  2. **Implement** `src/app/api/t2a/route.ts`:
     ```typescript
     import { NextRequest, NextResponse } from 'next/server';

     export const maxDuration = 30;

     const MINIMAX_URL = 'https://api.minimax.io/v1/t2a_v2';
     const VALID_EMOTIONS = ['happy','sad','angry','fearful','disgusted','surprised','calm','fluent','whisper'] as const;
     const VALID_FORMATS = ['mp3', 'wav', 'flac'] as const;

     const ERROR_MAP: Record<number, { status: number; message: string }> = {
       1000: { status: 500, message: 'An unknown error occurred.' },
       1001: { status: 504, message: 'Request timed out.' },
       1002: { status: 429, message: 'Rate limit exceeded. Please wait before retrying.' },
       1004: { status: 401, message: 'API authentication failed.' },
       1008: { status: 402, message: 'Insufficient API balance.' },
       1039: { status: 429, message: 'Text processing limit exceeded. Reduce text length.' },
       1042: { status: 400, message: 'Input contains too many special characters.' },
       2013: { status: 400, message: 'Invalid request parameters.' },
     };

     export async function POST(req: NextRequest) {
       const apiKey = process.env.MINIMAX_API_KEY;
       if (!apiKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

       const body = await req.json();
       // ... validation ...
       // Build MiniMax request:
       const minimaxReq = {
         model: 'speech-2.8-hd',
         text: body.text,
         stream: false,
         output_format: 'url',
         language_boost: 'auto',
         voice_setting: {
           voice_id: body.voiceId ?? 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67',
           speed: body.speed ?? 1.0,
           vol: body.vol ?? 1.0,
           pitch: body.pitch ?? 0,
           ...(body.emotion && { emotion: body.emotion }),
         },
         audio_setting: {
           format: body.format ?? 'mp3',
           sample_rate: 32000,
           bitrate: 128000,
           channel: 1,
         },
       };
       // Build URL (with optional GroupId)
       let url = MINIMAX_URL;
       const groupId = process.env.MINIMAX_GROUP_ID;
       if (groupId) url += `?GroupId=${groupId}`;

       const res = await fetch(url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${apiKey}`,
         },
         body: JSON.stringify(minimaxReq),
       });
       const data = await res.json();
       // Check base_resp.status_code
       if (data.base_resp?.status_code !== 0) {
         const mapped = ERROR_MAP[data.base_resp.status_code];
         return NextResponse.json(
           { error: mapped?.message ?? data.base_resp?.status_msg ?? 'Unknown error' },
           { status: mapped?.status ?? 500 }
         );
       }
       // Null check data.data
       if (!data.data?.audio) {
         return NextResponse.json({ error: 'No audio data returned from MiniMax' }, { status: 500 });
       }
       return NextResponse.json({
         audioUrl: data.data.audio,
         traceId: data.trace_id,
         durationMs: data.extra_info?.audio_length,
         usageCharacters: data.extra_info?.usage_characters,
       });
     }
     ```

  **Must NOT do**:
  - Do NOT expose API key to client (no NEXT_PUBLIC_ prefix)
  - Do NOT implement streaming (stream: false always)
  - Do NOT add rate limiting logic server-side
  - Do NOT use `neutral` as a valid emotion
  - Do NOT accept vol=0 (minimum 0.1)
  - Do NOT accept `output_format: 'hex'` (always use 'url')

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: TDD with 19+ test cases, API integration with error mapping, needs thorough implementation
  - Skills: [] — No special skills needed
  - Omitted: [`playwright`] — Unit tests only, no browser needed

  **Parallelization**: Can Parallel: YES (with Task 3, 4) | Wave 2 | Blocks: [9] | Blocked By: [1, 3]

  **References**:
  - API Spec: MiniMax T2A v2 OpenAPI — POST `https://api.minimax.io/v1/t2a_v2`
  - Auth: `Authorization: Bearer {MINIMAX_API_KEY}`
  - Request body: `T2aV2Req` schema (model, text, stream, output_format, voice_setting, audio_setting)
  - Response body: `T2aV2Resp` schema (data.audio = CDN URL, base_resp.status_code, extra_info)
  - Error codes: 0=success, 1002=rate limit, 1004=auth fail, 1008=balance, 1042=invalid chars, 2013=bad params
  - `data.data` CAN BE NULL — must null-check before accessing `.audio`
  - `output_format: 'url'` returns CDN URL valid 24 hours
  - Valid emotions: happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper (NO 'neutral')
  - vol range: (0, 10] — minimum 0.1, NOT 0
  - speed range: [0.5, 2.0]
  - pitch range: [-12, 12] integer
  - audio formats: mp3, wav, flac (wav is non-streaming only — fine since we're non-streaming)
  - GroupId: optional query param `?GroupId={MINIMAX_GROUP_ID}`, only if env var set
  - External: https://platform.minimax.io/docs/api-reference/speech-t2a-http

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/api/t2a.test.ts` — all 19+ tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] API route file exists at `src/app/api/t2a/route.ts`
  - [ ] `export const maxDuration = 30` is present in route file
  - [ ] Route validates: text required, text <= 10000, vol 0.1-10, speed 0.5-2, pitch -12~12
  - [ ] Route maps MiniMax error codes to appropriate HTTP status codes
  - [ ] Route null-checks `data.data?.audio` before returning

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: All unit tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/api/t2a.test.ts
    Expected: All 19+ tests pass, exit code 0
    Evidence: .sisyphus/evidence/task-2-api-tests.txt

  Scenario: Empty text returns 400
    Tool: Bash
    Steps: curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/t2a -H "Content-Type: application/json" -d '{"text":""}'
    Expected: HTTP 400
    Evidence: .sisyphus/evidence/task-2-api-empty-text.txt

  Scenario: Invalid vol returns 400
    Tool: Bash
    Steps: curl -s -X POST http://localhost:3000/api/t2a -H "Content-Type: application/json" -d '{"text":"test","vol":0}' | jq '.error'
    Expected: Contains "vol must be between"
    Evidence: .sisyphus/evidence/task-2-api-invalid-vol.txt
  ```

  **Commit**: YES | Message: `feat(api): add /api/t2a proxy route with TDD validation and MiniMax error mapping` | Files: [src/app/api/t2a/route.ts, src/__tests__/api/t2a.test.ts]

- [x] 3. Shared Types + Constants

  **What to do**:
  1. Create `src/lib/types.ts` with all TypeScript interfaces:
     ```typescript
     export type Emotion = 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'calm' | 'fluent' | 'whisper';
     export type AudioFormat = 'mp3' | 'wav' | 'flac';

     export interface VoiceSettings {
       voiceId: string;
       speed: number;
       vol: number;
       pitch: number;
       emotion?: Emotion;
     }

     export interface AudioSettings {
       format: AudioFormat;
     }

     export interface GenerateRequest {
       text: string;
       voiceId?: string;
       speed?: number;
       vol?: number;
       pitch?: number;
       emotion?: Emotion;
       format?: AudioFormat;
     }

     export interface GenerateResponse {
       audioUrl: string;
       traceId: string;
       durationMs?: number;
       usageCharacters?: number;
     }

     export interface GenerationResult {
       audioUrl: string;
       traceId: string;
       generatedAt: number;
       durationMs?: number;
       usageCharacters?: number;
     }

     export interface HistoryEntry extends GenerationResult {
       id: string;
       text: string;
       textPreview: string;
       voiceSettings: VoiceSettings;
       audioSettings: AudioSettings;
     }

     export interface ApiError {
       error: string;
     }
     ```

  2. Create `src/lib/constants.ts`:
     ```typescript
     import type { VoiceSettings, AudioSettings, Emotion, AudioFormat } from './types';

     export const VOICE_ID = 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67';

     export const EMOTIONS: readonly Emotion[] = [
       'happy', 'sad', 'angry', 'fearful', 'disgusted',
       'surprised', 'calm', 'fluent', 'whisper'
     ] as const;

     export const AUDIO_FORMATS: readonly AudioFormat[] = ['mp3', 'wav', 'flac'] as const;

     export const MAX_TEXT_LENGTH = 10_000;
     export const CHAR_WARNING_THRESHOLD = 9_000;
     export const HISTORY_EXPIRY_MS = 23 * 60 * 60 * 1000; // 23 hours
     export const MAX_HISTORY_ITEMS = 50;

     export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
       voiceId: VOICE_ID,
       speed: 1.0,
       vol: 1.0,
       pitch: 0,
       emotion: undefined, // Let MiniMax auto-select
     };

     export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
       format: 'mp3',
     };

     export const EMOTION_LABELS: Record<Emotion, string> = {
       happy: 'Happy 😊',
       sad: 'Sad 😢',
       angry: 'Angry 😠',
       fearful: 'Fearful 😨',
       disgusted: 'Disgusted 🤢',
       surprised: 'Surprised 😲',
       calm: 'Calm 😌',
       fluent: 'Fluent 🗣️',
       whisper: 'Whisper 🤫',
     };
     ```

  3. Create `src/lib/errors.ts`:
     ```typescript
     export const MINIMAX_ERROR_MESSAGES: Record<number, string> = {
       0: 'Success',
       1000: 'Unknown error occurred. Please try again.',
       1001: 'Request timed out. Please try again.',
       1002: 'Rate limit exceeded. Please wait before retrying.',
       1004: 'API authentication failed.',
       1008: 'Insufficient API balance.',
       1039: 'Text processing limit exceeded. Reduce text length.',
       1042: 'Input contains too many special characters. Remove invisible or control characters.',
       2013: 'Invalid request parameters.',
     };

     export function getErrorMessage(statusCode: number): string {
       return MINIMAX_ERROR_MESSAGES[statusCode] ?? `Unknown error (code: ${statusCode})`;
     }
     ```

  **Must NOT do**:
  - Do NOT include `neutral` in Emotion type or EMOTIONS array
  - Do NOT use `NEXT_PUBLIC_` for any server-only values
  - Do NOT define vol min as 0 — it's 0.1

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Pure type definitions and constants, no logic
  - Skills: [] — No special skills needed
  - Omitted: [`frontend-ui-ux`] — No UI work

  **Parallelization**: Can Parallel: YES (with Task 2, 4) | Wave 2 | Blocks: [2, 4, 5, 6, 7, 8, 9] | Blocked By: [1]

  **References**:
  - MiniMax T2A v2 API spec: emotion list, audio format list, voice_setting ranges
  - Voice ID: `moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] `src/lib/types.ts` exists with VoiceSettings, HistoryEntry, GenerateRequest, GenerateResponse
  - [ ] `src/lib/constants.ts` exists with VOICE_ID, EMOTIONS (9 items, no 'neutral'), AUDIO_FORMATS
  - [ ] `src/lib/errors.ts` exists with MINIMAX_ERROR_MESSAGES mapping
  - [ ] `grep -c 'neutral' src/lib/constants.ts` returns 0

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Types compile without errors
    Tool: Bash
    Steps: npx tsc --noEmit
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-3-types-tsc.txt

  Scenario: No 'neutral' emotion in constants
    Tool: Bash
    Steps: grep -c 'neutral' src/lib/constants.ts
    Expected: Output is 0
    Evidence: .sisyphus/evidence/task-3-no-neutral.txt
  ```

  **Commit**: YES | Message: `feat: add shared TypeScript types, constants, and error mappings` | Files: [src/lib/types.ts, src/lib/constants.ts, src/lib/errors.ts]

- [x] 4. `useLocalStorage` Hook + `useHistory` Hook (TDD)

  **What to do**:
  1. **Write tests FIRST** in `src/__tests__/hooks/useLocalStorage.test.ts`:
     - Test: returns default value on first render (no localStorage)
     - Test: reads existing value from localStorage on mount (via useEffect)
     - Test: persists value to localStorage on setValue
     - Test: handles corrupted JSON gracefully (returns default, logs warning)
     - Test: removeValue clears localStorage key
     - Test: SSR-safe — no localStorage access during SSR (no window reference)

  2. **Implement** `src/hooks/useLocalStorage.ts`:
     ```typescript
     'use client';
     import { useState, useEffect, useCallback } from 'react';

     export function useLocalStorage<T>(key: string, defaultValue: T) {
       const [value, setValue] = useState<T>(defaultValue);
       const [mounted, setMounted] = useState(false);

       useEffect(() => {
         setMounted(true);
         try {
           const stored = localStorage.getItem(key);
           if (stored !== null) {
             setValue(JSON.parse(stored));
           }
         } catch {
           console.warn(`Failed to parse localStorage key "${key}"`);
           localStorage.removeItem(key);
         }
       }, [key]);

       const setAndPersist = useCallback((newValue: T | ((prev: T) => T)) => {
         setValue(prev => {
           const resolved = typeof newValue === 'function'
             ? (newValue as (prev: T) => T)(prev)
             : newValue;
           try { localStorage.setItem(key, JSON.stringify(resolved)); } catch {}
           return resolved;
         });
       }, [key]);

       const removeValue = useCallback(() => {
         setValue(defaultValue);
         localStorage.removeItem(key);
       }, [key, defaultValue]);

       return { value, setValue: setAndPersist, removeValue, mounted } as const;
     }
     ```

  3. **Write tests** for `src/__tests__/hooks/useHistory.test.ts`:
     - Test: initializes with empty array
     - Test: addItem prepends to history
     - Test: addItem caps at MAX_HISTORY_ITEMS (50), removing oldest
     - Test: clearHistory empties the array
     - Test: isExpired returns true for items older than 23h
     - Test: isExpired returns false for recent items

  4. **Implement** `src/hooks/useHistory.ts`:
     ```typescript
     'use client';
     import { useCallback } from 'react';
     import { useLocalStorage } from './useLocalStorage';
     import { HistoryEntry } from '@/lib/types';
     import { MAX_HISTORY_ITEMS, HISTORY_EXPIRY_MS } from '@/lib/constants';

     export function useHistory() {
       const { value: history, setValue: setHistory, removeValue: clearHistory, mounted } =
         useLocalStorage<HistoryEntry[]>('vibeVoice:history', []);

       const addItem = useCallback((entry: HistoryEntry) => {
         setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY_ITEMS));
       }, [setHistory]);

       const isExpired = useCallback((entry: HistoryEntry) => {
         return Date.now() - entry.generatedAt > HISTORY_EXPIRY_MS;
       }, []);

       return { history, addItem, clearHistory, isExpired, mounted };
     }
     ```

  **Must NOT do**:
  - Do NOT access `localStorage` outside of `useEffect` (SSR crash)
  - Do NOT use `window` directly — check `typeof window !== 'undefined'` or use mounted guard
  - Do NOT store more than 50 items

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: TDD with SSR-safety concerns, hook composition
  - Skills: [] — No special skills needed
  - Omitted: [`frontend-ui-ux`] — No UI work

  **Parallelization**: Can Parallel: YES (with Task 2, 3) | Wave 2 | Blocks: [8, 9] | Blocked By: [1, 3]

  **References**:
  - Pattern: React `useState` + `useEffect` for SSR-safe localStorage
  - Constants: `MAX_HISTORY_ITEMS = 50`, `HISTORY_EXPIRY_MS = 23 * 60 * 60 * 1000` from `src/lib/constants.ts`
  - Type: `HistoryEntry` from `src/lib/types.ts`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/hooks/` — all tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] `src/hooks/useLocalStorage.ts` exists
  - [ ] `src/hooks/useHistory.ts` exists
  - [ ] No direct `localStorage` access outside of `useEffect` in hook files

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: All hook tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/hooks/
    Expected: All tests pass, exit code 0
    Evidence: .sisyphus/evidence/task-4-hooks-tests.txt

  Scenario: No direct localStorage access outside useEffect
    Tool: Bash
    Steps: grep -n 'localStorage' src/hooks/useLocalStorage.ts
    Expected: All localStorage references are inside useEffect or useCallback
    Evidence: .sisyphus/evidence/task-4-ssr-safe.txt
  ```

  **Commit**: YES | Message: `feat: add SSR-safe useLocalStorage and useHistory hooks with TDD tests` | Files: [src/hooks/useLocalStorage.ts, src/hooks/useHistory.ts, src/__tests__/hooks/useLocalStorage.test.ts, src/__tests__/hooks/useHistory.test.ts]

- [x] 5. `TextInputPanel` Component

  **What to do**:
  1. Create `src/components/TextInputPanel.tsx`:
     ```tsx
     'use client';
     import { Textarea } from '@/components/ui/textarea';
     import { Button } from '@/components/ui/button';
     import { Label } from '@/components/ui/label';
     import { MAX_TEXT_LENGTH, CHAR_WARNING_THRESHOLD } from '@/lib/constants';
     import { Loader2 } from 'lucide-react';

     interface Props {
       text: string;
       onChange: (text: string) => void;
       onGenerate: () => void;
       isLoading: boolean;
     }

     export function TextInputPanel({ text, onChange, onGenerate, isLoading }: Props) {
       const charCount = text.length;
       const isOverLimit = charCount > MAX_TEXT_LENGTH;
       const isWarning = charCount > CHAR_WARNING_THRESHOLD;
       const canGenerate = text.trim().length > 0 && !isOverLimit && !isLoading;
       // ... render textarea, char count, generate button
     }
     ```

  2. Create test `src/__tests__/components/TextInputPanel.test.tsx`:
     - Test: renders textarea with `data-testid="text-input"`
     - Test: char count shows "0 / 10,000" initially
     - Test: char count updates on typing
     - Test: char count turns red (`text-destructive`) when > 9,000
     - Test: generate button disabled when text empty
     - Test: generate button disabled when text > 10,000 chars
     - Test: generate button disabled when isLoading=true
     - Test: generate button shows spinner (Loader2) when isLoading
     - Test: onGenerate called on button click with valid text
     - Test: textarea placeholder text is present

  **UI Layout**:
  - Label: "Script" at top
  - Textarea: full width, 8 rows, placeholder "Enter your text here... (supports pause markers like <#1.5#> and interjection tags like (laughs))"
  - Below textarea: char count on right, format "N / 10,000"
  - Generate button: full width, "Generate Audio" text, Loader2 spinner when loading
  - All interactive elements must have `data-testid` attributes

  **Must NOT do**:
  - Do NOT implement character limit enforcement (allow typing beyond, just show error)
  - Do NOT add pronunciation dict or subtitle UI here

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI component with design considerations
  - Skills: [`frontend-ui-ux`, `design-principles`] — Clean dashboard component design
  - Omitted: [`playwright`] — Unit tests, not E2E

  **Parallelization**: Can Parallel: YES (with Task 6, 7, 8) | Wave 3 | Blocks: [9] | Blocked By: [1, 3]

  **References**:
  - UI Components: `@/components/ui/textarea`, `@/components/ui/button`, `@/components/ui/label` (from shadcn)
  - Constants: `MAX_TEXT_LENGTH`, `CHAR_WARNING_THRESHOLD` from `@/lib/constants`
  - Icon: `Loader2` from `lucide-react` (included with shadcn)
  - Text features: Pause markers `<#x#>`, interjection tags `(laughs)`, `(sighs)` etc. (mention in placeholder)

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/components/TextInputPanel.test.tsx` — all tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] Component renders textarea with `data-testid="text-input"`
  - [ ] Component renders generate button with `data-testid="generate-btn"`
  - [ ] Component renders char count with `data-testid="char-count"`

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Component tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/components/TextInputPanel.test.tsx
    Expected: All tests pass, exit code 0
    Evidence: .sisyphus/evidence/task-5-textinput-tests.txt

  Scenario: Generate button correctly disabled for empty text
    Tool: Bash
    Steps: npx vitest run --reporter=verbose src/__tests__/components/TextInputPanel.test.tsx -t "disabled"
    Expected: Tests matching "disabled" pass
    Evidence: .sisyphus/evidence/task-5-disabled-tests.txt
  ```

  **Commit**: YES | Message: `feat(ui): add TextInputPanel component with char count and generate button` | Files: [src/components/TextInputPanel.tsx, src/__tests__/components/TextInputPanel.test.tsx]

- [x] 6. `VoiceSettingsPanel` Component

  **What to do**:
  1. Create `src/components/VoiceSettingsPanel.tsx`:
     - Speed slider: min=0.5, max=2, step=0.1, default=1.0, `data-testid="speed-slider"`
     - Volume slider: min=0.1, max=10, step=0.1, default=1.0, `data-testid="vol-slider"`
     - Pitch slider: min=-12, max=12, step=1, default=0, `data-testid="pitch-slider"`
     - Emotion select: 9 options from EMOTIONS constant, `data-testid="emotion-select"`, with "Auto (recommended)" as default empty option
     - Format select: mp3/wav/flac from AUDIO_FORMATS, `data-testid="format-select"`
     - Current value displayed next to each slider (e.g., "Speed: 1.0x")
     - All sliders use shadcn `Slider` component
     - All selects use shadcn `Select` component

  2. Create test `src/__tests__/components/VoiceSettingsPanel.test.tsx`:
     - Test: speed slider renders with correct min/max/default
     - Test: vol slider min is 0.1 (NOT 0)
     - Test: pitch slider renders with min=-12, max=12
     - Test: emotion select has exactly 9 options (+ "Auto" placeholder)
     - Test: emotion select does NOT have "neutral" option
     - Test: format select has mp3/wav/flac
     - Test: onChange called with correct VoiceSettings on slider change
     - Test: current values displayed ("Speed: 1.0x", "Volume: 1.0", "Pitch: 0")

  **UI Layout**:
  - Card container with title "Voice Settings"
  - Grid of settings with labels
  - Each slider: Label + current value on same line, slider below
  - Selects: Label above, full-width select below
  - Compact layout using shadcn Card, Label, Separator

  **Must NOT do**:
  - Do NOT set vol minimum to 0 (must be 0.1)
  - Do NOT include "neutral" in emotion options
  - Do NOT include voice_modify controls (pitch/intensity/timbre/sound_effects)
  - Do NOT include sample_rate, bitrate, channel controls

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Complex UI with multiple interactive controls
  - Skills: [`frontend-ui-ux`, `design-principles`] — Dashboard slider/select design
  - Omitted: [`playwright`] — Unit tests, not E2E

  **Parallelization**: Can Parallel: YES (with Task 5, 7, 8) | Wave 3 | Blocks: [9] | Blocked By: [1, 3]

  **References**:
  - UI Components: `@/components/ui/slider`, `@/components/ui/select`, `@/components/ui/card`, `@/components/ui/label`, `@/components/ui/separator`
  - Constants: `EMOTIONS`, `AUDIO_FORMATS`, `EMOTION_LABELS`, `DEFAULT_VOICE_SETTINGS`, `DEFAULT_AUDIO_SETTINGS` from `@/lib/constants`
  - Types: `VoiceSettings`, `AudioSettings`, `Emotion`, `AudioFormat` from `@/lib/types`
  - Voice setting ranges: speed [0.5, 2], vol (0.1, 10], pitch [-12, 12]

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/components/VoiceSettingsPanel.test.tsx` — all tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] Vol slider minimum is 0.1
  - [ ] No "neutral" option in emotion select

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Component tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/components/VoiceSettingsPanel.test.tsx
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-6-voicesettings-tests.txt

  Scenario: Vol minimum validation
    Tool: Bash
    Steps: grep -n '0\.1' src/components/VoiceSettingsPanel.tsx
    Expected: At least one match showing vol min=0.1
    Evidence: .sisyphus/evidence/task-6-vol-min.txt
  ```

  **Commit**: YES | Message: `feat(ui): add VoiceSettingsPanel with speed/vol/pitch sliders and emotion/format selects` | Files: [src/components/VoiceSettingsPanel.tsx, src/__tests__/components/VoiceSettingsPanel.test.tsx]

- [x] 7. `AudioPlayer` Component

  **What to do**:
  1. Create `src/components/AudioPlayer.tsx`:
     - Native `<audio controls>` element with `data-testid="audio-player"`
     - Download button: `<a href={audioUrl} download>` with `data-testid="download-btn"`
     - Format badge showing current format (mp3/wav/flac) using shadcn Badge
     - Duration display if available (convert ms to MM:SS)
     - Usage characters display if available
     - Hidden (return null) when audioUrl is null/undefined
     - Card container with title "Audio Output"

  2. Create test `src/__tests__/components/AudioPlayer.test.tsx`:
     - Test: returns null when audioUrl is null
     - Test: returns null when audioUrl is undefined
     - Test: renders audio element with correct src when URL provided
     - Test: audio element has controls attribute
     - Test: download link has href=audioUrl and download attribute
     - Test: download link has `data-testid="download-btn"`
     - Test: audio element has `data-testid="audio-player"`
     - Test: format badge shows correct format text
     - Test: duration displays in MM:SS format when provided

  **Must NOT do**:
  - Do NOT build a custom audio player with seek bar — use native `<audio controls>`
  - Do NOT implement waveform visualization
  - Do NOT fetch/stream audio — just use the CDN URL directly

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI component with download functionality
  - Skills: [`frontend-ui-ux`, `design-principles`] — Clean audio player card
  - Omitted: [`playwright`] — Unit tests only

  **Parallelization**: Can Parallel: YES (with Task 5, 6, 8) | Wave 3 | Blocks: [9] | Blocked By: [1, 3]

  **References**:
  - UI Components: `@/components/ui/card`, `@/components/ui/badge`, `@/components/ui/button`
  - Icon: `Download` from `lucide-react`
  - Types: `GenerationResult` from `@/lib/types`
  - CDN URL: Direct URL from MiniMax, valid 24 hours, playable in `<audio src>`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/components/AudioPlayer.test.tsx` — all tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] Component returns null when no audioUrl

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Component tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/components/AudioPlayer.test.tsx
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-7-audioplayer-tests.txt

  Scenario: Null URL renders nothing
    Tool: Bash
    Steps: npx vitest run --reporter=verbose src/__tests__/components/AudioPlayer.test.tsx -t "null"
    Expected: Null-related tests pass
    Evidence: .sisyphus/evidence/task-7-null-tests.txt
  ```

  **Commit**: YES | Message: `feat(ui): add AudioPlayer with native audio element and download button` | Files: [src/components/AudioPlayer.tsx, src/__tests__/components/AudioPlayer.test.tsx]

- [x] 8. `GenerationHistory` Component

  **What to do**:
  1. Create `src/components/GenerationHistory.tsx`:
     - ScrollArea wrapping list of Card items
     - Each item shows: text preview (first 80 chars), relative time ("2 hours ago"), format badge
     - Expired items (>23h): show destructive Badge "Expired", disable play/download
     - Non-expired items: clickable, calls onSelect with HistoryEntry
     - Clear all button at top: `data-testid="clear-history-btn"`
     - Empty state with `data-testid="history-empty"`
     - Each item: `data-testid="history-item-{id}"`
     - Expired badge: `data-testid="expired-badge"`

  2. Create `src/lib/utils.ts` (or extend existing):
     - `formatRelativeTime(timestamp: number): string` — "just now", "5 minutes ago", "2 hours ago", "1 day ago"
     - `formatDuration(ms: number): string` — "1:23" format

  3. Create test `src/__tests__/components/GenerationHistory.test.tsx`:
     - Test: shows empty state when history is []
     - Test: renders history items with correct data-testid
     - Test: shows text preview (first 80 chars)
     - Test: shows "Expired" badge for items older than 23 hours
     - Test: expired items have disabled play/download
     - Test: non-expired items are clickable
     - Test: clear button calls onClear
     - Test: clicking non-expired item calls onSelect
     - Test: shows relative time for items
     - Test: items sorted newest first

  **Must NOT do**:
  - Do NOT implement infinite scroll or pagination
  - Do NOT fetch audio or attempt to re-validate CDN URLs
  - Do NOT allow editing history items

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Complex list UI with expiry logic
  - Skills: [`frontend-ui-ux`, `design-principles`] — Dashboard history list design
  - Omitted: [`playwright`] — Unit tests only

  **Parallelization**: Can Parallel: YES (with Task 5, 6, 7) | Wave 3 | Blocks: [9] | Blocked By: [1, 3, 4]

  **References**:
  - UI Components: `@/components/ui/card`, `@/components/ui/scroll-area`, `@/components/ui/badge`, `@/components/ui/button`
  - Icons: `Trash2`, `Play`, `Download` from `lucide-react`
  - Types: `HistoryEntry` from `@/lib/types`
  - Constants: `HISTORY_EXPIRY_MS` from `@/lib/constants`
  - Hook: `useHistory` from `@/hooks/useHistory` (isExpired function)

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/__tests__/components/GenerationHistory.test.tsx` — all tests pass
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] Component renders empty state with `data-testid="history-empty"` when list empty
  - [ ] Expired badge shows for old items

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Component tests pass
    Tool: Bash
    Steps: npx vitest run src/__tests__/components/GenerationHistory.test.tsx
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-8-history-tests.txt

  Scenario: Expired items detected correctly
    Tool: Bash
    Steps: npx vitest run --reporter=verbose src/__tests__/components/GenerationHistory.test.tsx -t "expired"
    Expected: Expired-related tests pass
    Evidence: .sisyphus/evidence/task-8-expired-tests.txt
  ```

  **Commit**: YES | Message: `feat(ui): add GenerationHistory with expiry detection, relative time, and clear button` | Files: [src/components/GenerationHistory.tsx, src/__tests__/components/GenerationHistory.test.tsx, src/lib/utils.ts]

- [x] 9. Main Page Integration — Wire All Components Together

  **What to do**:
  1. Implement `src/app/page.tsx` as the main dashboard page:
     ```tsx
     'use client';
     import { useState } from 'react';
     import { toast } from 'sonner';
     import { TextInputPanel } from '@/components/TextInputPanel';
     import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
     import { AudioPlayer } from '@/components/AudioPlayer';
     import { GenerationHistory } from '@/components/GenerationHistory';
     import { useHistory } from '@/hooks/useHistory';
     import { DEFAULT_VOICE_SETTINGS, DEFAULT_AUDIO_SETTINGS } from '@/lib/constants';
     import type { VoiceSettings, AudioSettings, GenerationResult, HistoryEntry } from '@/lib/types';

     export default function Home() {
       const [text, setText] = useState('');
       const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
       const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
       const [isLoading, setIsLoading] = useState(false);
       const [currentAudio, setCurrentAudio] = useState<GenerationResult | null>(null);
       const { history, addItem, clearHistory, isExpired, mounted } = useHistory();

       const handleGenerate = async () => {
         setIsLoading(true);
         try {
           const res = await fetch('/api/t2a', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               text,
               voiceId: voiceSettings.voiceId,
               speed: voiceSettings.speed,
               vol: voiceSettings.vol,
               pitch: voiceSettings.pitch,
               emotion: voiceSettings.emotion,
               format: audioSettings.format,
             }),
           });
           const data = await res.json();
           if (!res.ok) {
             toast.error(data.error || 'Failed to generate audio');
             return;
           }
           const result: GenerationResult = {
             audioUrl: data.audioUrl,
             traceId: data.traceId,
             generatedAt: Date.now(),
             durationMs: data.durationMs,
             usageCharacters: data.usageCharacters,
           };
           setCurrentAudio(result);
           const entry: HistoryEntry = {
             ...result,
             id: crypto.randomUUID(),
             text,
             textPreview: text.slice(0, 80),
             voiceSettings: { ...voiceSettings },
             audioSettings: { ...audioSettings },
           };
           addItem(entry);
           toast.success('Audio generated successfully!');
         } catch {
           toast.error('Network error. Please check your connection and try again.');
         } finally {
           setIsLoading(false);
         }
       };

       const handleHistorySelect = (entry: HistoryEntry) => {
         if (!isExpired(entry)) {
           setCurrentAudio(entry);
           setText(entry.text);
           setVoiceSettings(entry.voiceSettings);
           setAudioSettings(entry.audioSettings);
         }
       };

       return (
         // Layout: max-w-7xl mx-auto, grid lg:grid-cols-2 gap-6
         // Left column: TextInputPanel + VoiceSettingsPanel (stacked)
         // Right column: AudioPlayer + GenerationHistory (stacked)
         // Header: "VibeVoice" title + subtitle
         // Sonner toast provider in layout.tsx
       );
     }
     ```

  2. Update `src/app/layout.tsx`:
     - Add `<Toaster />` from sonner
     - Set page title: "VibeVoice — Text to Audio"
     - Set meta description
     - Dark mode support via `className="dark"` on html tag (or respect system preference)

  3. Update `src/app/globals.css`:
     - Keep Tailwind directives
     - Add any custom styles needed for the dashboard layout
     - Ensure dark mode variables from shadcn are present

  **Must NOT do**:
  - Do NOT add authentication
  - Do NOT add server components with data fetching
  - Do NOT implement streaming audio playback
  - Do NOT add voice selector (single voice only)
  - Do NOT access localStorage outside of useEffect/hooks

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Full page layout, component composition, visual polish
  - Skills: [`frontend-ui-ux`, `design-principles`] — Dashboard layout design
  - Omitted: [`playwright`] — Tested by E2E in Task 10

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [10, 11] | Blocked By: [2, 3, 4, 5, 6, 7, 8]

  **References**:
  - Components: All from Tasks 5-8 (TextInputPanel, VoiceSettingsPanel, AudioPlayer, GenerationHistory)
  - Hooks: `useHistory` from Task 4
  - Constants: `DEFAULT_VOICE_SETTINGS`, `DEFAULT_AUDIO_SETTINGS` from `@/lib/constants`
  - Types: All types from `@/lib/types`
  - Toast: `sonner` — `toast.error()`, `toast.success()`
  - Layout: shadcn dark mode setup, Toaster component

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx next build` exits with code 0
  - [ ] `npx tsc --noEmit` exits with code 0
  - [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` returns 200
  - [ ] Page contains all 4 components (TextInputPanel, VoiceSettingsPanel, AudioPlayer, GenerationHistory)
  - [ ] Sonner Toaster is rendered in layout

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: Page loads successfully
    Tool: Bash
    Steps: npx next build && npx next start & sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
    Expected: HTTP 200
    Evidence: .sisyphus/evidence/task-9-page-load.txt

  Scenario: Build succeeds with all components integrated
    Tool: Bash
    Steps: npx next build
    Expected: Exit code 0, no type errors
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: API route accessible
    Tool: Bash
    Steps: curl -s -X POST http://localhost:3000/api/t2a -H "Content-Type: application/json" -d '{}' | jq '.error'
    Expected: Returns error message (not 404)
    Evidence: .sisyphus/evidence/task-9-api-accessible.txt
  ```

  **Commit**: YES | Message: `feat: integrate all components in main dashboard page with state management and API calls` | Files: [src/app/page.tsx, src/app/layout.tsx, src/app/globals.css]

- [x] 10. Playwright E2E Test Suite

  **What to do**:
  1. Create `e2e/vibeVoice.spec.ts` with comprehensive E2E tests:

     ```typescript
     import { test, expect } from '@playwright/test';

     test.describe('VibeVoice Dashboard', () => {
       test('page loads without console errors', async ({ page }) => {
         const errors: string[] = [];
         page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
         await page.goto('/');
         expect(errors).toHaveLength(0);
       });

       test('generate button disabled on empty text', async ({ page }) => {
         await page.goto('/');
         await expect(page.getByTestId('generate-btn')).toBeDisabled();
       });

       test('char count updates in real-time', async ({ page }) => {
         await page.goto('/');
         await page.getByTestId('text-input').fill('hello world');
         await expect(page.getByTestId('char-count')).toContainText('11');
       });

       test('char count turns red at warning threshold', async ({ page }) => {
         await page.goto('/');
         await page.getByTestId('text-input').fill('a'.repeat(9001));
         const charCount = page.getByTestId('char-count');
         await expect(charCount).toHaveClass(/destructive|red/);
       });

       test('vol slider minimum is 0.1', async ({ page }) => {
         await page.goto('/');
         const slider = page.getByTestId('vol-slider');
         await expect(slider).toBeVisible();
         // Verify min value is displayed or aria attribute
       });

       test('emotion select has no neutral option', async ({ page }) => {
         await page.goto('/');
         await page.getByTestId('emotion-select').click();
         const options = page.locator('[role="option"]');
         const texts = await options.allTextContents();
         expect(texts.join(' ').toLowerCase()).not.toContain('neutral');
       });

       test('generate flow with mocked API', async ({ page }) => {
         await page.route('/api/t2a', route => {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
               audioUrl: 'https://example.com/test.mp3',
               traceId: 'test-trace-123',
               durationMs: 5000,
               usageCharacters: 10,
             }),
           });
         });
         await page.goto('/');
         await page.getByTestId('text-input').fill('Hello world test');
         await page.getByTestId('generate-btn').click();
         await expect(page.getByTestId('audio-player')).toBeVisible();
         await expect(page.getByTestId('download-btn')).toBeVisible();
       });

       test('history persists after reload', async ({ page }) => {
         await page.route('/api/t2a', route => {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
               audioUrl: 'https://example.com/test.mp3',
               traceId: 'test-trace-456',
             }),
           });
         });
         await page.goto('/');
         await page.getByTestId('text-input').fill('persistence test');
         await page.getByTestId('generate-btn').click();
         await expect(page.locator('[data-testid^="history-item-"]')).toHaveCount(1);
         await page.reload();
         await expect(page.locator('[data-testid^="history-item-"]')).toHaveCount(1);
       });

       test('error toast on API failure', async ({ page }) => {
         await page.route('/api/t2a', route => {
           route.fulfill({
             status: 429,
             contentType: 'application/json',
             body: JSON.stringify({ error: 'Rate limit exceeded. Please wait before retrying.' }),
           });
         });
         await page.goto('/');
         await page.getByTestId('text-input').fill('rate limit test');
         await page.getByTestId('generate-btn').click();
         await expect(page.locator('text=Rate limit exceeded')).toBeVisible({ timeout: 5000 });
       });

       test('clear history button works', async ({ page }) => {
         // Set up localStorage with mock history
         await page.goto('/');
         await page.evaluate(() => {
           localStorage.setItem('vibeVoice:history', JSON.stringify([{
             id: 'test-1', text: 'test', textPreview: 'test',
             audioUrl: 'https://example.com/a.mp3', traceId: 't1',
             generatedAt: Date.now(),
             voiceSettings: { voiceId: 'test', speed: 1, vol: 1, pitch: 0 },
             audioSettings: { format: 'mp3' },
           }]));
         });
         await page.reload();
         await expect(page.locator('[data-testid^="history-item-"]')).toHaveCount(1);
         await page.getByTestId('clear-history-btn').click();
         await expect(page.getByTestId('history-empty')).toBeVisible();
       });

       test('expired history items show expired badge', async ({ page }) => {
         await page.goto('/');
         await page.evaluate(() => {
           localStorage.setItem('vibeVoice:history', JSON.stringify([{
             id: 'expired-1', text: 'old text', textPreview: 'old text',
             audioUrl: 'https://example.com/old.mp3', traceId: 't-old',
             generatedAt: Date.now() - 24 * 60 * 60 * 1000, // 24h ago
             voiceSettings: { voiceId: 'test', speed: 1, vol: 1, pitch: 0 },
             audioSettings: { format: 'mp3' },
           }]));
         });
         await page.reload();
         await expect(page.getByTestId('expired-badge')).toBeVisible();
       });
     });
     ```

  **Must NOT do**:
  - Do NOT test against real MiniMax API (mock all /api/t2a calls)
  - Do NOT test voice cloning features
  - Do NOT add visual regression tests

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: Comprehensive E2E test suite with API mocking
  - Skills: [`playwright`] — Playwright expertise for E2E testing
  - Omitted: [`frontend-ui-ux`] — No UI design needed

  **Parallelization**: Can Parallel: YES (with Task 11) | Wave 5 | Blocks: [F1-F4] | Blocked By: [9]

  **References**:
  - Config: `playwright.config.ts` from Task 1
  - Test IDs: `text-input`, `char-count`, `generate-btn`, `audio-player`, `download-btn`, `vol-slider`, `emotion-select`, `history-item-{id}`, `history-empty`, `clear-history-btn`, `expired-badge`
  - API route: `POST /api/t2a` — mock with `page.route()`
  - History key: `vibeVoice:history` in localStorage
  - External: https://playwright.dev/docs/mock — Playwright route mocking

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx playwright test` — all tests pass
  - [ ] E2E test file exists at `e2e/vibeVoice.spec.ts`
  - [ ] All API calls in tests are mocked (no real MiniMax calls)
  - [ ] Tests cover: page load, char count, generate flow, history, error toast, expired items, clear history

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: All E2E tests pass
    Tool: Bash
    Steps: npx playwright test
    Expected: All tests pass, exit code 0
    Evidence: .sisyphus/evidence/task-10-e2e-results.txt

  Scenario: E2E test report generated
    Tool: Bash
    Steps: npx playwright test --reporter=html
    Expected: playwright-report/index.html exists
    Evidence: .sisyphus/evidence/task-10-e2e-report.txt
  ```

  **Commit**: YES | Message: `test(e2e): add Playwright E2E test suite covering all dashboard user flows` | Files: [e2e/vibeVoice.spec.ts]

- [x] 11. Polish + README

  **What to do**:
  1. Create `README.md` with sections:
     - **Overview**: VibeVoice — MiniMax T2A voice synthesis dashboard
     - **Features**: Text-to-audio, voice settings, history, download
     - **Quick Start**: Clone, install, set env vars, run
     - **Environment Variables**: `MINIMAX_API_KEY` (required), `MINIMAX_GROUP_ID` (optional) — where to find them on MiniMax platform
     - **Usage**:
       - Enter text (max 10,000 chars)
       - Adjust voice settings (speed, volume, pitch, emotion)
       - Select audio format (mp3, wav, flac)
       - Click Generate
       - Play and download audio
     - **Text Formatting Tips**:
       - Pause markers: `<#1.5#>` for 1.5 second pause
       - Interjection tags (speech-2.8 models): `(laughs)`, `(sighs)`, `(gasps)`, `(coughs)`, etc.
       - Paragraph breaks: Use newlines
     - **API Limits**: 60 RPM, 20K chars/min, 10K chars per request
     - **Audio URL Expiry**: CDN links valid for 24 hours
     - **Tech Stack**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Vitest, Playwright

  2. Review all error messages for consistency and clarity
  3. Ensure all components have proper `aria-label` attributes for accessibility
  4. Add loading skeleton to history panel while `mounted` is false

  **Must NOT do**:
  - Do NOT add deployment instructions (out of scope)
  - Do NOT add contributing guidelines
  - Do NOT add license file

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: Documentation and polish
  - Skills: [] — No special skills needed
  - Omitted: [`frontend-ui-ux`] — Minor polish only, not major UI work

  **Parallelization**: Can Parallel: YES (with Task 10) | Wave 5 | Blocks: [F1-F4] | Blocked By: [9]

  **References**:
  - MiniMax docs: https://platform.minimax.io/docs/api-reference/speech-t2a-http
  - Rate limits: 60 RPM, 20K chars/min
  - Text features: Pause `<#x#>`, interjection tags `(laughs)` etc.
  - Audio URL: CDN valid 24h

  **Acceptance Criteria** (agent-executable only):
  - [ ] `README.md` exists with >50 lines
  - [ ] README contains "MINIMAX_API_KEY" and "MINIMAX_GROUP_ID"
  - [ ] README contains "10,000" (char limit) and "24 hours" (URL expiry)
  - [ ] `npx next lint` exits with code 0
  - [ ] `npx tsc --noEmit` exits with code 0

  **QA Scenarios** (MANDATORY):
  ```
  Scenario: README is comprehensive
    Tool: Bash
    Steps: wc -l README.md && grep -c "MINIMAX_API_KEY" README.md
    Expected: >50 lines, MINIMAX_API_KEY mentioned at least once
    Evidence: .sisyphus/evidence/task-11-readme.txt

  Scenario: Lint passes
    Tool: Bash
    Steps: npx next lint
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/task-11-lint.txt
  ```

  **Commit**: YES | Message: `docs: add README with setup, usage, text formatting tips, and API limits` | Files: [README.md]

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [x] F1. Plan Compliance Audit — oracle
  - Verify all 11 tasks completed per plan specifications
  - Check all acceptance criteria met
  - Verify no scope creep (no features from Must NOT Have list)
  - Verify API key not exposed in any client-side code

- [x] F2. Code Quality Review — unspecified-high
  - TypeScript strict mode compliance
  - No `any` types
  - Consistent error handling patterns
  - shadcn component usage follows conventions
  - All `data-testid` attributes present on interactive elements

- [x] F3. Real Manual QA — unspecified-high + playwright
  - Run `npx next dev`
  - Navigate to http://localhost:3000
  - Generate audio with real MiniMax API
  - Verify audio plays in browser
  - Verify download works
  - Verify history persistence across page reload
  - Verify error toast on empty text
  - Take screenshots as evidence

- [x] F4. Scope Fidelity Check — deep
  - Verify NONE of the "Must NOT Have" features were implemented
  - Verify `neutral` emotion doesn't exist anywhere in code
  - Verify `vol` minimum is 0.1 everywhere
  - Verify no `NEXT_PUBLIC_MINIMAX_API_KEY` in any file
  - Verify localStorage access is SSR-safe

## Commit Strategy

```
Wave 1:
  feat: scaffold Next.js project with TypeScript, Tailwind, shadcn/ui, Vitest, Playwright

Wave 2:
  feat: add shared TypeScript types, constants, and error mappings
  feat(api): add /api/t2a proxy route with TDD validation and MiniMax error mapping
  feat: add SSR-safe useLocalStorage and useHistory hooks with TDD tests

Wave 3:
  feat(ui): add TextInputPanel component with char count and generate button
  feat(ui): add VoiceSettingsPanel with speed/vol/pitch sliders and emotion/format selects
  feat(ui): add AudioPlayer with native audio element and download button
  feat(ui): add GenerationHistory with expiry detection, relative time, and clear button

Wave 4:
  feat: integrate all components in main dashboard page with state management and API calls

Wave 5:
  test(e2e): add Playwright E2E test suite covering all dashboard user flows
  docs: add README with setup, usage, text formatting tips, and API limits
```

## Success Criteria

All of the following must be true:
1. `npx vitest run` — ALL unit tests pass (19+ API tests, 6+ hook tests, component tests)
2. `npx playwright test` — ALL E2E tests pass (10+ scenarios)
3. `npx tsc --noEmit` — Zero TypeScript errors
4. `npx next build` — Build succeeds
5. `npx next lint` — Zero lint errors
6. Real audio generation works with MiniMax API (verified by F3)
7. Audio playback works in browser (verified by F3)
8. Audio download works (verified by F3)
9. History persists across page reload (verified by E2E and F3)
10. No API key exposed in client-side code (verified by F4)
11. No `neutral` emotion anywhere in code (verified by F4)
12. Vol minimum is 0.1 everywhere (verified by F4)
