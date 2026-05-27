# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeVoice is a Text-to-Audio dashboard powered by the MiniMax T2A API. Users can convert text to speech with 300+ voices, clone voices from audio, design new voices via AI, and apply audio effects. Single-page app with simple password auth.

## Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check
npm test                 # Unit tests (Vitest, once)
npm run test:watch       # Unit tests (watch mode)
npm run test:e2e         # E2E tests (Playwright, Chromium on port 3100)
npm run test:e2e:ui      # E2E tests with Playwright UI
```

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS 4 + shadcn/ui

**Data flow**: No database. All API routes (`src/app/api/`) are server-side proxies to the MiniMax API with validation. Client state persists in localStorage (`vibeVoice:` prefix) via custom hooks.

**Auth**: Password checked against `AUTH_PASSWORD` env var → sets `vv-session` HTTP-only cookie (7-day TTL). Proxy (`src/proxy.ts`) enforces auth on all routes except `/login` and API auth endpoints.

### Key directories

- `src/app/api/` — API route handlers (t2a, voices, voice-design, voice-clone, files/upload, auth)
- `src/components/` — Page-level panels (TextInputPanel, VoiceSettingsPanel, VoiceLibraryPanel, GenerationHistory, AudioPlayer) + dialogs (VoiceDesignDialog, VoiceCloneDialog)
- `src/components/ui/` — shadcn/ui primitives (Button, Dialog, Tabs, etc.)
- `src/hooks/` — `useLocalStorage` (SSR-safe with corruption recovery), `useHistory` (generation history with normalization and 23h expiry)
- `src/lib/` — `types.ts` (domain interfaces), `constants.ts` (defaults, valid options), `errors.ts` (MiniMax error code mapping), `utils.ts` (cn helper, formatRelativeTime)

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Environment Variables

- `MINIMAX_API_KEY` (required) — MiniMax API key
- `MINIMAX_GROUP_ID` (optional) — For some MiniMax account types
- `AUTH_PASSWORD` (required) — App login password

## API Limits

- 10,000 chars/request, 60 RPM, 20,000 chars/min
- Audio URLs expire after 24 hours (drives the 23h history expiry)
- Clone audio: 10s–5min, ≤20MB, voices auto-delete after 7 days unused

## Text Formatting

Supports pause tags `<#X#>`, interjections like `(laughs)`, and paragraph breaks for natural pauses.
