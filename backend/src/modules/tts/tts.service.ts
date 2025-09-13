import { HttpService } from '@nestjs/axios'
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { AppConfigService } from 'src/common/config/config.service'
import { S3Service } from 'src/common/s3/s3.service'
import { firstValueFrom } from 'rxjs'
import { normalizeTtsText, buildTtsS3Key } from 'src/common/utils/speech.utils'
import { detectFormat } from '../chat/tts/utils/audio-format.util'
import { buildSynthesizeUrl } from '../chat/tts/utils/synthesize-url.util'
import { arrayBufferToString, extractBase64FromJson } from '../chat/tts/utils/tts-response.util'

@Injectable()
export class TtsService {
	private readonly logger = new Logger(TtsService.name)
	private readonly endpoint: string
	private readonly apiKey?: string
	private readonly audioPrefix: string
	private readonly bucket: string

	constructor(
		private readonly http: HttpService,
		private readonly config: AppConfigService,
		private readonly s3: S3Service,
	) {
		this.endpoint = this.config.speech.ttsEndpointUrl
		this.apiKey = this.config.speech.atlantiApiKey
		this.audioPrefix = this.config.s3.audioPrefix
		this.bucket = this.config.s3.bucket
	}

	// --- Small helpers to split responsibilities ---
	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json, audio/*',
		}
		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`
			headers['X-API-Key'] = this.apiKey
		}
		return headers
	}

	private async postSynthesize(
		synthUrl: string,
		payload: Record<string, string>,
		headers: Record<string, string>,
	) {
		return firstValueFrom(
			this.http.post(synthUrl, payload, {
				headers,
				timeout: 30000,
				responseType: 'arraybuffer',
				maxContentLength: Infinity as unknown as number,
				maxBodyLength: Infinity as unknown as number,
				validateStatus: () => true,
			}),
		)
	}

	private isHttpResponse(
		obj: unknown,
	): obj is { status?: number; headers?: Record<string, unknown>; data?: unknown } {
		return (
			!!obj &&
			typeof obj === 'object' &&
			('status' in (obj as Record<string, unknown>) ||
				'headers' in (obj as Record<string, unknown>) ||
				'data' in (obj as Record<string, unknown>))
		)
	}

	private parseAudioFromResponse(resp: unknown): { audioBuffer: Buffer; contentType: string } {
		if (!this.isHttpResponse(resp)) {
			throw new InternalServerErrorException('Invalid TTS response')
		}
		const status = resp.status ?? 0
		const contentType = String((resp.headers?.['content-type'] as string) || '').toLowerCase()
		if (status < 200 || status >= 300) {
			const bodyPreview = Buffer.isBuffer(resp.data)
				? resp.data.toString('utf8').slice(0, 256)
				: String(resp.data).slice(0, 256)
			throw new InternalServerErrorException(
				`TTS HTTP ${status} (${contentType || 'unknown'}): ${bodyPreview || 'no body'}`,
			)
		}

		let audioBuffer: Buffer | null = null
		if (contentType.startsWith('audio/')) {
			audioBuffer = Buffer.isBuffer(resp.data) ? resp.data : Buffer.from(resp.data as ArrayBuffer)
			return { audioBuffer, contentType }
		}

		// Try JSON paths with base64 audio
		const text = arrayBufferToString(resp.data as ArrayBuffer | Buffer)
		let parsed: unknown
		try {
			parsed = JSON.parse(text) as unknown
		} catch {
			throw new InternalServerErrorException('TTS returned non-JSON response')
		}
		if (!parsed || typeof parsed !== 'object') {
			throw new InternalServerErrorException('TTS returned unexpected JSON shape')
		}
		const root = parsed as unknown
		// root may contain an error string
		if (
			typeof (root as Record<string, unknown>)['error'] === 'string' &&
			(root as Record<string, unknown>)['error']
		) {
			const err = String((root as Record<string, unknown>)['error'])
			throw new InternalServerErrorException(`TTS error: ${err}`)
		}
		const b64 = extractBase64FromJson(root)
		if (!b64) {
			throw new InternalServerErrorException('TTS returned no audio payload')
		}
		audioBuffer = Buffer.from(b64, 'base64')
		return { audioBuffer, contentType: 'audio/mpeg' }
	}

	/** Generate or fetch cached TTS audio for given text and voice. */
	async getOrCreate(
		text: string,
		voice = 'default',
	): Promise<{ key: string; url: string; bytes: number }> {
		if (!this.endpoint) {
			throw new InternalServerErrorException('TTS endpoint not configured')
		}

		const normalized = normalizeTtsText(text)
		if (!normalized) {
			throw new InternalServerErrorException('Empty text after normalization')
		}

		if (normalized.length > 10000) {
			throw new InternalServerErrorException('Text exceeds 10k characters')
		}

		// Build a provisional key with mp3 ext for cache check. We'll adjust on upload if needed.
		const provisionalExt = 'mp3'
		let keyRelative = buildTtsS3Key(voice, 'v1', normalized, provisionalExt)
		let key = `${this.audioPrefix}/${keyRelative}`

		// Cache hit?
		const exists = await this.s3.exists(key)
		if (exists) {
			const url = `${this.config.s3.responseEndpoint}/${this.bucket}/${key}`
			const size = await this.s3.getSize(key)
			return { key, url, bytes: size ?? -1 }
		}

		// Call external TTS
		try {
			const payload: Record<string, string> = { text: normalized }
			const synthUrl = buildSynthesizeUrl(this.endpoint)
			const headers = this.buildHeaders()
			const resp = await this.postSynthesize(synthUrl, payload, headers)

			const { audioBuffer } = this.parseAudioFromResponse(resp)

			if (!audioBuffer || audioBuffer.length === 0) {
				throw new InternalServerErrorException('Empty audio buffer from TTS')
			}

			this.logger.debug(`TTS received audio buffer length=${audioBuffer.length}`)
			const { ext, contentType: finalContentType } = detectFormat(audioBuffer)
			if (ext !== provisionalExt) {
				keyRelative = buildTtsS3Key(voice, 'v1', normalized, ext)
				key = `${this.audioPrefix}/${keyRelative}`
			}

			// Upload; if a race condition created the key in the meantime, it's fine
			this.logger.debug(
				`Uploading TTS audio to S3 key=${this.audioPrefix}/${keyRelative} type=${finalContentType}`,
			)
			try {
				await this.s3.uploadAudio(keyRelative, audioBuffer, finalContentType)
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err)
				this.logger.error(`S3 upload failed for ${this.audioPrefix}/${keyRelative}: ${msg}`)
				throw new InternalServerErrorException(`TTS S3 upload failed: ${msg}`)
			}
			const url = `${this.config.s3.responseEndpoint}/${this.bucket}/${this.audioPrefix}/${keyRelative}`
			return { key: `${this.audioPrefix}/${keyRelative}`, url, bytes: audioBuffer.length }
		} catch (e) {
			this.logger.error('TTS generation failed', e)
			throw e
		}
	}
}
