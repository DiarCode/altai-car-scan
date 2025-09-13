# TTS Module

- POST /tts — body { voice: string, text: string }
- Caches by sanitized text+voice hash to S3 under `audio/tts/{voice}/{sha256}.mp3`.
- Returns a public URL via MediaUrlService and a `cached` flag.
