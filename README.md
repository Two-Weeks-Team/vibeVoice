# VibeVoice

> Text-to-Audio dashboard powered by [MiniMax T2A API](https://platform.minimax.io/docs/api-reference/speech-t2a-http)

Convert text scripts to natural-sounding speech using a cloned voice, with full control over speech settings (speed, volume, pitch, emotion) and a persistent generation history.

## Features

- **Text-to-Audio Generation** — Convert up to 10,000 characters of text to speech
- **Voice Settings** — Adjust speed (0.5x-2x), volume, pitch (+-12 semitones), and emotion
- **Emotion Control** — 9 emotion modes: happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper
- **Audio Format Selection** — Generate in MP3, WAV, or FLAC format
- **Generation History** — Last 50 generations persisted across sessions (localStorage)
- **Expired URL Detection** — Audio links are valid 24 hours; expired items are clearly marked
- **One-click Download** — Download generated audio in the selected format

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS + shadcn/ui |
| Unit Tests | Vitest + React Testing Library |
| E2E Tests | Playwright (Chromium) |
| Audio API | MiniMax T2A v2 (`speech-2.8-hd`) |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
MINIMAX_API_KEY=your_api_key_here
MINIMAX_GROUP_ID=your_group_id_here   # optional for most accounts
```

> **Where to find these:**
> - `MINIMAX_API_KEY` — [MiniMax Platform -> Account -> API Keys](https://platform.minimax.io/user-center/basic-information/interface-key)
> - `MINIMAX_GROUP_ID` — Required only for some account types. Found in your account dashboard.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter your text** in the script area (up to 10,000 characters)
2. **Adjust voice settings** — speed, volume, pitch, and emotion (optional)
3. **Select audio format** — MP3 (default), WAV, or FLAC
4. **Click "Generate Audio"** — wait a few seconds for synthesis
5. **Play the audio** directly in the browser
6. **Download** the audio file with one click
7. **History** — past generations are saved and can be replayed (valid for 24 hours)

## Text Formatting Tips

MiniMax's `speech-2.8-hd` model supports special text markers for enhanced control:

### Pause Markers

Insert timed pauses using `<#X#>` where X is seconds (0.01-99.99):

```
Hello, world. <#1.5#> This pause lasted 1.5 seconds.
```

### Interjection Tags

Add natural speech sounds between text segments:

```
I can't believe it (gasps). That's amazing (laughs)!
```

**Available interjections**: `(laughs)`, `(chuckle)`, `(coughs)`, `(clear-throat)`, `(groans)`, `(breath)`, `(pant)`, `(inhale)`, `(exhale)`, `(gasps)`, `(sniffs)`, `(sighs)`, `(snorts)`, `(burps)`, `(lip-smacking)`, `(humming)`, `(hissing)`, `(emm)`, `(sneezes)`

> Note: Interjection tags are only supported with `speech-2.8-hd` and `speech-2.8-turbo` models.

### Paragraph Breaks

Use newlines to create natural paragraph-level pauses:

```
First paragraph. Natural pause.

Second paragraph starts here.
```

## API Limits

| Limit | Value |
|-------|-------|
| Max text length | 10,000 characters |
| Requests per minute | 60 RPM (default tier) |
| Characters per minute | 20,000 chars/min |
| Audio URL validity | 24 hours |

> **Audio URL Expiry**: Generated audio URLs are CDN links that expire after 24 hours. The history panel shows an "Expired" badge on old items. Re-generate the audio to get a fresh link.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MINIMAX_API_KEY` | **Yes** | MiniMax API authentication key |
| `MINIMAX_GROUP_ID` | No | Group ID for certain account types |

> Warning: Never commit `.env.local` to version control. It is listed in `.gitignore` by default.

## Development

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (requires dev server running)
npm run test:e2e

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── api/t2a/route.ts    # MiniMax T2A proxy API route
│   ├── layout.tsx           # Root layout with Toaster
│   └── page.tsx             # Main dashboard page
├── components/
│   ├── TextInputPanel.tsx   # Script input with char count
│   ├── VoiceSettingsPanel.tsx # Speed/vol/pitch/emotion controls
│   ├── AudioPlayer.tsx      # Audio playback + download
│   └── GenerationHistory.tsx # Past generations list
├── hooks/
│   ├── useLocalStorage.ts   # SSR-safe localStorage hook
│   └── useHistory.ts        # Generation history management
└── lib/
    ├── types.ts             # TypeScript interfaces
    ├── constants.ts         # App-wide constants
    ├── errors.ts            # MiniMax error code mappings
    └── utils.ts             # Utility functions (cn, formatRelativeTime)
```
