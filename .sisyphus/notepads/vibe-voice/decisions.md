# VibeVoice Decisions

## [2026-03-17] Core Decisions
- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui
- Audio: Non-streaming, output_format='url' (24h CDN link)
- Model: speech-2.8-hd
- State: React useState + localStorage (no DB)
- Tests: Vitest (unit) + Playwright (E2E)
- Emotion default: undefined (MiniMax auto-select), NOT 'neutral'
- vol min: 0.1 (not 0)
- maxDuration = 30 in API route
- localStorage key: 'vibeVoice:history'
