import { Injectable } from '@nestjs/common'
import { AppConfigService } from 'src/common/config/config.service'
import axios from 'axios'
import FormData from 'form-data'
import { PronunciationASRAdapter } from './asr-adapter.interface'

@Injectable()
export class WhisperASRAdapter implements PronunciationASRAdapter {
	readonly modelName = 'whisper'

	constructor(private readonly config: AppConfigService) {}

	async transcribe(audioBuffer: Buffer, language: string) {
		const apiKey = this.config.openai.apiKey
		const url = 'https://api.openai.com/v1/audio/transcriptions'
		const form = new FormData()
		form.append('file', audioBuffer, {
			filename: 'audio.ogg',
			contentType: 'audio/ogg',
		})
		form.append('model', 'whisper-1')
		form.append('language', language)

		const response = await axios.post(url, form, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				...form.getHeaders(),
			},
			maxBodyLength: Infinity,
		})
		const data: { text: string } = response.data as { text: string }
		return {
			transcript: data.text || '',
			phonemes: undefined, // OpenAI Whisper API does not return phonemes
			confidence: undefined, // Not provided by OpenAI
		}
	}
}
