// src/modules/exercises/media/audio.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from 'src/common/s3/s3.service'
import { AppConfigService } from 'src/common/config/config.service'
import { OpenAI } from 'openai'
import { Buffer } from 'buffer'
import { TtsService } from 'src/modules/tts/tts.service'

@Injectable()
export class AudioService {
	private readonly client: OpenAI
	private readonly ttsModel: string
	private readonly audioPrefix: string
	private readonly bucket: string
	private readonly logger = new Logger(AudioService.name)

	constructor(
		private readonly s3: S3Service,
		private readonly config: AppConfigService,
		private readonly tts: TtsService,
	) {
		this.ttsModel = this.config.openai.ttsModel
		// single bucket name + prefix
		this.bucket = this.config.s3.bucket
		this.audioPrefix = this.config.s3.audioPrefix
		this.client = new OpenAI({ apiKey: this.config.openai.apiKey })
	}

	/** Synthesize text via external TTS with S3 caching, returning Buffer for immediate uses. */
	async synthesizeBuffer(text: string, voice = 'default'): Promise<Buffer> {
		const { key, bytes } = await this.tts.getOrCreate(text, voice)
		// Download buffer from S3 to return. We keep API same for callers that need Buffer.
		const buf = await this.s3.getObjectBuffer(this.bucket, key)
		this.logger.debug(`TTS synthesis resolved from ${bytes === -1 ? 'cache' : 'provider'}`)
		return buf
	}

	/**
	 * Synthesize text and keep the audio in S3 (cache-first). Returns the S3 key and a public URL.
	 * Prefer this for exercise media to avoid re-uploading and format mismatches.
	 */
	async synthesizeToS3(
		text: string,
		voice = 'default',
	): Promise<{ key: string; url: string; bytes: number }> {
		const res = await this.tts.getOrCreate(text, voice)
		this.logger.debug(`TTS synthesizeToS3: ${res.bytes === -1 ? 'cache' : 'provider'}`)
		return res
	}

	async uploadAudio(key: string, buffer: Buffer): Promise<string> {
		const filename = `${key}.ogg`
		this.logger.log(`🟢 uploadAudio: start (key="${key}", filename="${filename}")`)

		try {
			// buffer is already a valid Ogg/Opus blob from OpenAI
			const uploadedKey = await this.s3.uploadAudio(filename, buffer, 'audio/ogg')
			this.logger.log(`✅ uploadAudio succeeded: "${uploadedKey}"`)
			return uploadedKey
		} catch (err: unknown) {
			if (err instanceof Error) {
				this.logger.error(`❌ uploadAudio failed for "${filename}"`, err.stack)
			} else {
				this.logger.error(`❌ uploadAudio failed for "${filename}"`, String(err))
			}
			throw err
		}
	}

	/** Delete audio/<key>.ogg */
	async deleteAudio(key: string): Promise<void> {
		const filename = `${key}.ogg`
		// generic delete: pass the full key (prefix + filename)
		await this.s3.delete(`${this.audioPrefix}/${filename}`)
	}
}
