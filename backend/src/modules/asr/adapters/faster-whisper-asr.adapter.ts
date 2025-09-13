import { Injectable } from '@nestjs/common'
import { PronunciationASRAdapter } from './asr-adapter.interface'
import { AppConfigService } from 'src/common/config/config.service'
import axios from 'axios'
import FormData from 'form-data'

@Injectable()
export class FasterWhisperASRAdapter implements PronunciationASRAdapter {
	readonly modelName = 'faster-whisper'

	constructor(private readonly config: AppConfigService) {}

	async transcribe(audioBuffer: Buffer, language: string) {
		const { sttEndpointUrl, atlantiApiKey } = this.config.speech
		if (!sttEndpointUrl) {
			throw new Error('STT endpoint URL is not configured')
		}

		const form = new FormData()
		// Provider expects `audio` field name
		form.append('audio', audioBuffer, {
			filename: 'audio.ogg',
			contentType: 'audio/ogg',
		})
		// Language form field is supported
		if (language) form.append('language', language)

		const url = new URL(sttEndpointUrl)
		// Normalize to /transcribe per docs
		if (!url.pathname.endsWith('/transcribe')) {
			url.pathname = `${url.pathname.replace(/\/$/, '')}/transcribe`
		}

		const res = await axios.post(url.toString(), form, {
			headers: {
				...(atlantiApiKey
					? { Authorization: `Bearer ${atlantiApiKey}`, 'X-API-Key': atlantiApiKey }
					: {}),
				...form.getHeaders(),
			},
			maxBodyLength: Infinity,
			maxContentLength: Infinity,
			timeout: 60_000,
		})

		// Provider JSON: { success, data: { text, confidence?, phonemes? }, error? }
		const raw: unknown = res.data
		let transcript = ''
		let confidence: number | undefined
		let phonemes: string | undefined
		if (raw && typeof raw === 'object') {
			const obj = raw as { success?: unknown; data?: unknown; error?: unknown }
			if (obj.error && typeof obj.error === 'string') {
				throw new Error(`STT error: ${obj.error}`)
			}
			if (obj.data && typeof obj.data === 'object') {
				const data = obj.data as { text?: unknown; confidence?: unknown; phonemes?: unknown }
				if (typeof data.text === 'string') transcript = data.text
				if (typeof data.confidence === 'number') confidence = data.confidence
				if (typeof data.phonemes === 'string') phonemes = data.phonemes
			}
		}

		return { transcript, confidence, phonemes }
	}
}
