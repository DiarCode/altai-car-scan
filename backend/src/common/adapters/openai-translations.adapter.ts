import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { NATIVE_LANGUAGE } from '@prisma/client'
import { AppConfigService } from 'src/common/config/config.service'
import { PromptBuilderService } from 'src/common/llm/prompt.builder'
import { TranslationsAdapter } from 'src/modules/translations/adapter/translations-adapter.interface'
import {
	SegmentTranslationResult,
	InterestSegmentTranslationResult,
	ExerciseTranslationResult,
	AssessmentQuestionTranslationResult,
	ModuleVocabularyTranslationResult,
} from 'src/modules/translations/adapter/translations-adapter.types'

@Injectable()
export class OpenAiTranslationsAdapter implements TranslationsAdapter {
	private static readonly MAX_RETRIES = 3
	private readonly logger = new Logger(OpenAiTranslationsAdapter.name)
	private readonly client: OpenAI

	constructor(
		private readonly config: AppConfigService,
		private readonly promptBuilder: PromptBuilderService,
	) {
		this.client = new OpenAI({ apiKey: config.openai.apiKey })
	}

	async translateSegment(
		segmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<SegmentTranslationResult> {
		const { messages, maxTokens } = await this.promptBuilder.buildTranslateSegmentTemplate(
			segmentId,
			targetLanguage,
		)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiTranslationsAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: maxTokens,
					messages,
				})
				const text = res.choices[0]?.message?.content ?? '{}'
				this.logger.debug(`Attempt ${attempt}: Translation response: ${text}`)

				const parsed = JSON.parse(text) as unknown
				if (this.isSegmentTranslationResult(parsed)) {
					return parsed
				}

				this.logger.warn(
					`Attempt ${attempt}: AI returned malformed segment translation, retrying...`,
					parsed,
				)
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: LLM error in segment translation`, err)
			}
		}

		this.logger.error(
			`All ${OpenAiTranslationsAdapter.MAX_RETRIES} attempts failed for segment translation`,
			lastError,
		)
		throw new InternalServerErrorException('Segment translation failed after retries')
	}

	async translateInterestSegment(
		interestSegmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<InterestSegmentTranslationResult> {
		const { messages, maxTokens } = await this.promptBuilder.buildTranslateInterestSegmentTemplate(
			interestSegmentId,
			targetLanguage,
		)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiTranslationsAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: maxTokens,
					messages,
				})
				const text = res.choices[0]?.message?.content ?? '{}'
				this.logger.debug(`Attempt ${attempt}: Interest segment translation response: ${text}`)

				const parsed = JSON.parse(text) as unknown
				if (this.isInterestSegmentTranslationResult(parsed)) {
					return parsed
				}

				this.logger.warn(
					`Attempt ${attempt}: AI returned malformed interest segment translation, retrying...`,
					parsed,
				)
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: LLM error in interest segment translation`, err)
			}
		}

		this.logger.error(
			`All ${OpenAiTranslationsAdapter.MAX_RETRIES} attempts failed for interest segment translation`,
			lastError,
		)
		throw new InternalServerErrorException('Interest segment translation failed after retries')
	}

	async translateExercise(
		exerciseId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<ExerciseTranslationResult> {
		const { messages, maxTokens } = await this.promptBuilder.buildTranslateExerciseTemplate(
			exerciseId,
			targetLanguage,
		)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiTranslationsAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: maxTokens,
					messages,
				})
				const raw = res.choices[0]?.message?.content ?? '{}'
				this.logger.debug(`Attempt ${attempt}: Exercise translation response: ${raw}`)

				const cleaned = raw
					.trim()
					.replace(/^```(?:json)?\s*/i, '')
					.replace(/\s*```$/i, '')
				const parsed = JSON.parse(cleaned) as unknown

				if (this.isExerciseTranslationResult(parsed)) {
					return parsed
				}

				this.logger.warn(
					`Attempt ${attempt}: AI returned malformed exercise translation, retrying...`,
					parsed,
				)
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: LLM error in exercise translation`, err)
			}
		}

		this.logger.error(
			`All ${OpenAiTranslationsAdapter.MAX_RETRIES} attempts failed for exercise translation`,
			lastError,
		)
		throw new InternalServerErrorException('Exercise translation failed after retries')
	}

	async translateAssessmentQuestion(
		questionId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<AssessmentQuestionTranslationResult> {
		const { messages, maxTokens } =
			await this.promptBuilder.buildTranslateAssessmentQuestionTemplate(questionId, targetLanguage)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiTranslationsAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: maxTokens,
					messages,
				})
				const text = res.choices[0]?.message?.content ?? '{}'
				this.logger.debug(`Attempt ${attempt}: Assessment question translation response: ${text}`)

				const parsed = JSON.parse(text) as unknown
				if (this.isAssessmentQuestionTranslationResult(parsed)) {
					return parsed
				}

				this.logger.warn(
					`Attempt ${attempt}: AI returned malformed assessment question translation, retrying...`,
					parsed,
				)
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: LLM error in assessment question translation`, err)
			}
		}

		this.logger.error(
			`All ${OpenAiTranslationsAdapter.MAX_RETRIES} attempts failed for assessment question translation`,
			lastError,
		)
		throw new InternalServerErrorException('Assessment question translation failed after retries')
	}

	async translateModuleVocabulary(
		vocabularyId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<ModuleVocabularyTranslationResult> {
		const { messages, maxTokens } = await this.promptBuilder.buildTranslateModuleVocabularyTemplate(
			vocabularyId,
			targetLanguage,
		)

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAiTranslationsAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: maxTokens,
					messages,
				})
				const text = res.choices[0]?.message?.content ?? '{}'
				this.logger.debug(`Attempt ${attempt}: Module vocabulary translation response: ${text}`)

				const parsed = JSON.parse(text) as unknown
				if (this.isModuleVocabularyTranslationResult(parsed)) {
					return parsed
				}

				this.logger.warn(
					`Attempt ${attempt}: AI returned malformed module vocabulary translation, retrying...`,
					parsed,
				)
			} catch (err) {
				lastError = err
				this.logger.error(`Attempt ${attempt}: LLM error in module vocabulary translation`, err)
			}
		}

		this.logger.error(
			`All ${OpenAiTranslationsAdapter.MAX_RETRIES} attempts failed for module vocabulary translation`,
			lastError,
		)
		throw new InternalServerErrorException('Module vocabulary translation failed after retries')
	}

	/**
	 * Type guards
	 */
	private isSegmentTranslationResult(obj: unknown): obj is SegmentTranslationResult {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}
		const record = obj as Record<string, unknown>
		return typeof record.title === 'string' && typeof record.theoryContent === 'string'
	}

	private isInterestSegmentTranslationResult(
		obj: unknown,
	): obj is InterestSegmentTranslationResult {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}
		const record = obj as Record<string, unknown>
		return typeof record.theoryContent === 'string'
	}

	private isExerciseTranslationResult(obj: unknown): obj is ExerciseTranslationResult {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}
		const record = obj as Record<string, unknown>
		return (
			typeof record.title === 'string' &&
			typeof record.payload === 'object' &&
			record.payload !== null
		)
	}

	private isAssessmentQuestionTranslationResult(
		obj: unknown,
	): obj is AssessmentQuestionTranslationResult {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}
		const record = obj as Record<string, unknown>
		return (
			typeof record.question === 'string' &&
			Array.isArray(record.answers) &&
			record.answers.every(
				(answer: unknown) =>
					typeof answer === 'object' &&
					answer !== null &&
					typeof (answer as Record<string, unknown>).answer === 'string',
			)
		)
	}

	private isModuleVocabularyTranslationResult(
		obj: unknown,
	): obj is ModuleVocabularyTranslationResult {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}
		const record = obj as Record<string, unknown>
		return (
			Array.isArray(record.translations) &&
			record.translations.every(
				(t: unknown) =>
					typeof t === 'object' &&
					t !== null &&
					typeof (t as Record<string, unknown>).language === 'string' &&
					typeof (t as Record<string, unknown>).translation === 'string',
			) &&
			Array.isArray(record.descriptions) &&
			record.descriptions.every(
				(d: unknown) =>
					typeof d === 'object' &&
					d !== null &&
					typeof (d as Record<string, unknown>).language === 'string' &&
					typeof (d as Record<string, unknown>).description === 'string',
			)
		)
	}
}
