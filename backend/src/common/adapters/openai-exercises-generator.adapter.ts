// src/modules/exercises/adapters/openai-exercises.adapter.ts

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { EXERCISE_TYPE } from '@prisma/client'
import { AppConfigService } from 'src/common/config/config.service'

import { ImageService } from 'src/modules/exercises/media/image.service'
import { AudioService } from 'src/modules/exercises/media/audio.service'
import { ExercisesAdapter } from 'src/modules/exercises/adapters/exercise-adapter.interface'
import { AdapterExerciseDto } from 'src/modules/exercises/adapters/exercise-adapter.types'
import { isAdapterExerciseDtoArray } from 'src/modules/exercises/adapters/exercise-types.guards'
import { PromptBuilderService } from '../llm/prompt.builder'
import {
	DictationPayload,
	ListeningQuizPayload,
	ListeningQuizQuestion,
	PictureDescriptionPayload,
	PronunciationPayload,
} from 'src/modules/exercises/dtos/exercise-payload.types'

@Injectable()
export class OpenAiExercisesAdapter implements ExercisesAdapter {
	private static readonly MAX_RETRIES = 3
	private static readonly IMAGE_SIZE = '1024x1024'
	private readonly logger = new Logger(OpenAiExercisesAdapter.name)
	private readonly client: OpenAI

	constructor(
		private readonly config: AppConfigService,
		private readonly promptBuilder: PromptBuilderService,
		private readonly imageService: ImageService,
		private readonly audioService: AudioService,
	) {
		this.client = new OpenAI({ apiKey: config.openai.apiKey })
	}

	async generateExercise<T extends EXERCISE_TYPE>(
		interestSegmentId: number,
		type: T,
	): Promise<Array<AdapterExerciseDto<T>>> {
		// 1) Build prompt (with stylePrompt injected for images and audio)
		const { messages, maxTokens } = await this.promptBuilder.buildGenerateExercisePrompt(
			interestSegmentId,
			type,
			1, // number of exercises to generate
		)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiExercisesAdapter.MAX_RETRIES; attempt++) {
			try {
				// 2) Query GPT
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: typeof maxTokens === 'number' ? maxTokens : 512,
					messages,
				})
				const raw = res.choices[0]?.message?.content ?? '[]'
				this.logger.debug(`Attempt ${attempt}: LLM response: ${raw}`)

				const json = raw
					.trim()
					.replace(/^```(?:json)?\s*/i, '')
					.replace(/\s*```$/i, '')
				const parsed = JSON.parse(json) as unknown

				if (!isAdapterExerciseDtoArray<T>(parsed, type)) {
					this.logger.warn(`Attempt ${attempt}: malformed DTO, retrying…`, parsed)
					continue
				}

				// 3) Generate/upload media where needed
				const enriched = await Promise.all(parsed.map((dto, idx) => this.attachMedia(dto, idx)))
				return enriched
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: error generating exercises`, err)
			}
		}

		this.logger.error(`All ${OpenAiExercisesAdapter.MAX_RETRIES} attempts failed`, lastError)
		throw new InternalServerErrorException('Exercise generation failed after retries')
	}

	/** Post‐process media (image or audio) and patch the DTO’s payload */
	private async attachMedia<T extends EXERCISE_TYPE>(
		dto: AdapterExerciseDto<T>,
		index: number,
	): Promise<AdapterExerciseDto<T>> {
		const keyBase = `${dto.type.toLowerCase()}/${Date.now()}-${index}`

		switch (dto.type) {
			// —— IMAGE —— //
			case EXERCISE_TYPE.PICTURE_DESCRIPTION: {
				const payload = dto.payload as PictureDescriptionPayload
				// Only the image uses the style prompt
				const style = this.promptBuilder.getStylePrompt(dto.type, index)
				const prompt = `${payload.prompt}. Render this as ${style}`
				const imgRes = await this.client.images.generate({
					prompt,
					size: OpenAiExercisesAdapter.IMAGE_SIZE,
					n: 1,
					model: this.config.openai.imageModel,
				})
				const url = imgRes.data?.[0]?.url
				if (!url) {
					throw new InternalServerErrorException('Image generation failed: no image returned')
				}
				const arrayBuffer = await fetch(url).then(r => r.arrayBuffer())
				const buffer = Buffer.from(arrayBuffer)
				const s3key = await this.imageService.uploadImage(keyBase, buffer)
				payload.imageUrl = s3key
				return dto
			}

			// —— DICTATION —— //
			case EXERCISE_TYPE.DICTATION: {
				const payload = dto.payload as DictationPayload
				// Only the transcript text is sent to TTS
				const { key } = await this.audioService.synthesizeToS3(payload.transcript)
				payload.audioUrl = key
				return dto
			}

			// —— LISTENING QUIZ —— //
			case EXERCISE_TYPE.LISTENING_QUIZ: {
				const payload = dto.payload as ListeningQuizPayload
				await Promise.all(
					payload.questions.map(async (q: ListeningQuizQuestion, idx) => {
						// Prefer `prompt` (audio content), fallback to `question` text
						const promptText = (q as unknown as { prompt?: unknown })?.prompt
						const ttsText =
							typeof promptText === 'string' && promptText.trim().length > 0
								? promptText
								: q.question
						this.logger.debug(
							`LISTENING_QUIZ Q${idx}: synthesizing audio from ${
								ttsText === q.question ? 'question' : 'prompt'
							}`,
						)
						const { key } = await this.audioService.synthesizeToS3(ttsText)
						q.audioUrl = key
					}),
				)
				return dto
			}

			// —— PRONUNCIATION —— //
			case EXERCISE_TYPE.PRONUNCIATION: {
				const payload = dto.payload as PronunciationPayload
				// Only the promptText goes to TTS
				const { key } = await this.audioService.synthesizeToS3(payload.text)
				payload.audioUrl = key
				return dto
			}

			// —— TEXT-ONLY —— //
			default:
				return dto
		}
	}
}
