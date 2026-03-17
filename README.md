# VibeVoice

> Text-to-Audio dashboard powered by [MiniMax T2A API](https://platform.minimax.io/docs/api-reference/speech-t2a-http)

Convert text scripts to natural-sounding speech with full control over voice selection, speech settings, and audio effects. Browse 300+ system voices, clone your own voice from audio, or design entirely new voices from text descriptions.

## Features

### Core

- **Text-to-Audio** — Convert up to 10,000 characters per request using MiniMax `speech-2.8-hd`
- **Voice Settings** — Speed (0.5x–2x), Volume, Pitch (±12 semitones), Emotion (9 modes)
- **Audio Formats** — MP3, WAV, FLAC
- **Generation History** — Last 50 generations with inline playback, settings summary, and 24h expiry detection

### Voice Library

- **300+ System Voices** — Browse and preview all MiniMax system voices with one-click play
- **Voice Preview** — Listen to any voice before selecting it (cached for the session)
- **Voice Selection** — Click to select, used for all subsequent generations

### Voice Design (AI)

- **Text-to-Voice** — Describe a voice in natural language (e.g., *"Warm male narrator with British accent"*) and generate it
- **Preview Audio** — Hear the designed voice immediately with custom preview text (max 500 chars)
- **Auto-saved** — Designed voices appear in Voice Library under the "Designed" tab

### Voice Cloning

- **Instant Clone** — Upload an audio sample (10s–5min, MP3/M4A/WAV, ≤20MB) to clone a voice
- **Noise Reduction / Volume Normalization** — Optional audio preprocessing
- **Display Names** — Name your cloned voices for easy identification
- **7-day TTL** — Cloned voices auto-delete if unused for 7 days

### Voice Effects (Post-processing)

- **Deepen / Brighten** — Pitch effect slider (-100 to 100)
- **Stronger / Softer** — Intensity slider (-100 to 100)
- **Nasal / Crisp** — Timbre slider (-100 to 100)
- **Sound Effects** — Spacious Echo, Auditorium Echo, Lo-Fi Telephone, Robotic

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Unit Tests | Vitest + React Testing Library |
| E2E Tests | Playwright (Chromium) |
| Audio API | MiniMax T2A v2, Voice Design, Voice Clone, Voice Management |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your MiniMax API key

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MINIMAX_API_KEY` | **Yes** | [MiniMax Platform → Account → API Keys](https://platform.minimax.io/user-center/basic-information/interface-key) |
| `MINIMAX_GROUP_ID` | No | Required only for some account types |

> `.env.local` is in `.gitignore` — never commit API keys.

## Usage

1. **Select a voice** from the Voice Library (System / Cloned / Designed tabs)
2. **Enter text** in the script area (up to 10,000 characters)
3. **Adjust settings** — speed, volume, pitch, emotion, audio format
4. **Apply effects** (optional) — deepen/brighten, stronger/softer, timbre, sound effects
5. **Click "Generate Audio"** → play and download the result
6. **History** — replay past generations with inline ▶ buttons

### Creating New Voices

**Voice Design** (header → "Design Voice"):
1. Describe the voice you want in natural language
2. Enter preview text (max 500 chars)
3. Click "Design Voice" → hear the result → it's saved to your library

**Voice Clone** (header → "Clone Voice"):
1. Upload an audio file (10s–5min, MP3/M4A/WAV)
2. Enter a Voice ID and display name
3. Click "Clone Voice" → the cloned voice appears in your library

## Text Formatting

| Feature | Syntax | Example |
|---------|--------|---------|
| Pause | `<#X#>` (seconds) | `Hello. <#1.5#> How are you?` |
| Interjection | `(tag)` | `That's amazing (laughs)!` |
| Paragraph break | Newline | Natural pause between paragraphs |

**Available interjections**: `(laughs)`, `(chuckle)`, `(coughs)`, `(clear-throat)`, `(groans)`, `(breath)`, `(pant)`, `(inhale)`, `(exhale)`, `(gasps)`, `(sniffs)`, `(sighs)`, `(snorts)`, `(burps)`, `(lip-smacking)`, `(humming)`, `(hissing)`, `(emm)`, `(sneezes)`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/t2a` | POST | Text-to-Audio proxy (with voice effects support) |
| `/api/voices` | GET | List all voices (system + cloned + designed) |
| `/api/voice-design` | POST | Create voice from text description |
| `/api/voice-clone` | POST | Clone voice from uploaded audio |
| `/api/files/upload` | POST | Upload audio file for cloning |
| `/api/voices/delete` | POST | Delete a cloned or designed voice |

## API Limits

| Limit | Value |
|-------|-------|
| Text per request | 10,000 characters |
| Requests per minute | 60 RPM |
| Characters per minute | 20,000 chars/min |
| Audio URL validity | 24 hours |
| Clone audio duration | 10 seconds – 5 minutes |
| Clone file size | ≤ 20 MB |
| Clone voice TTL | 7 days (if unused) |
| Voice Design preview | 500 characters max |

## Development

```bash
npm test              # Unit tests (Vitest)
npm run test:watch    # Watch mode
npm run test:e2e      # E2E tests (Playwright)
npx tsc --noEmit      # Type check
npm run lint          # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── t2a/route.ts           # T2A proxy with validation + voice effects
│   │   ├── voices/route.ts        # Voice list (GET)
│   │   ├── voices/delete/route.ts # Voice deletion
│   │   ├── voice-design/route.ts  # AI voice creation
│   │   ├── voice-clone/route.ts   # Voice cloning
│   │   └── files/upload/route.ts  # File upload for cloning
│   ├── layout.tsx
│   └── page.tsx                   # Main dashboard
├── components/
│   ├── TextInputPanel.tsx         # Script input + char count + generate
│   ├── VoiceSettingsPanel.tsx     # Speed/vol/pitch/emotion + voice effects
│   ├── VoiceLibraryPanel.tsx      # Voice browser with tabs + preview + rename
│   ├── VoiceDesignDialog.tsx      # AI voice creation modal
│   ├── VoiceCloneDialog.tsx       # Voice cloning modal (file upload)
│   ├── AudioPlayer.tsx            # Audio playback + download
│   └── GenerationHistory.tsx      # History with inline playback
├── hooks/
│   ├── useLocalStorage.ts         # SSR-safe localStorage
│   └── useHistory.ts              # Generation history management
└── lib/
    ├── types.ts                   # TypeScript interfaces
    ├── constants.ts               # App constants
    ├── errors.ts                  # MiniMax error mappings
    └── utils.ts                   # Utilities (cn, formatRelativeTime)
```
