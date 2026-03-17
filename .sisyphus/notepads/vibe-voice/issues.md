# VibeVoice Issues

## [2026-03-17] Known Gotchas (from Metis review)
1. data.data CAN BE NULL — null-check before accessing .audio
2. 'neutral' emotion DOES NOT EXIST — valid: happy/sad/angry/fearful/disgusted/surprised/calm/fluent/whisper
3. vol=0 is API error — minimum is 0.1
4. localStorage MUST be in useEffect (SSR safety)
5. CDN URLs expire after 24h — show "Expired" badge after 23h
6. export const maxDuration = 30 required in API route (Vercel timeout)
7. MINIMAX_GROUP_ID is optional — only append to URL if set
