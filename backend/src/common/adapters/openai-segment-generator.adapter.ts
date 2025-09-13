// import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
// import { OpenAI } from 'openai'
// import { AppConfigService } from 'src/common/config/config.service'
// import { PromptBuilderService } from 'src/common/llm/prompt.builder'
// import {
// 	AdapterSegmentDto,
// 	InterestSegmentDto,
// } from 'src/modules/segments/adapters/segment-adapter.types'
// import { SegmentsAdapter } from 'src/modules/segments/adapters/segments-adapter.interface'
// import { APPROVAL_STATUS, INTEREST } from '@prisma/client'

// @Injectable()
// export class OpenAiSegmentsAdapter implements SegmentsAdapter {
// 	private static readonly MAX_RETRIES = 3
// 	private readonly logger = new Logger(OpenAiSegmentsAdapter.name)
// 	private readonly client: OpenAI

// 	constructor(
// 		private readonly config: AppConfigService,
// 		private readonly promptBuilder: PromptBuilderService,
// 	) {
// 		this.client = new OpenAI({ apiKey: config.openai.apiKey })
// 	}

// 	async generateSegments(moduleId: number, count?: number): Promise<AdapterSegmentDto[]> {
// 		const { messages, maxTokens } = await this.promptBuilder.buildGenerateTemplate(moduleId, count)

// 		let lastError: unknown
// 		for (let attempt = 1; attempt <= OpenAiSegmentsAdapter.MAX_RETRIES; attempt++) {
// 			try {
// 				const res = await this.client.chat.completions.create({
// 					model: this.config.openai.model,
// 					max_tokens: maxTokens,
// 					messages,
// 				})
// 				const text = res.choices[0]?.message?.content ?? '[]'
// 				this.logger.debug(`Attempt ${attempt}: LLM response text: ${text}`)

// 				const parsed = JSON.parse(text) as unknown
// 				if (this.isAdapterSegmentDtoArray(parsed)) {
// 					return parsed
// 				}

// 				this.logger.warn(
// 					`Attempt ${attempt}: AI returned malformed generateSegments output, retrying...`,
// 					parsed,
// 				)
// 			} catch (err) {
// 				lastError = err
// 				this.logger.error(
// 					`Attempt ${attempt}: LLM error in generateSegments`,
// 					err,
// 					err instanceof Error ? err.message : '',
// 				)
// 			}
// 		}

// 		this.logger.error(
// 			`All ${OpenAiSegmentsAdapter.MAX_RETRIES} attempts failed for generateSegments`,
// 			lastError,
// 		)
// 		throw new InternalServerErrorException('AI segment generation failed after retries')
// 	}

// 	async generateInterestSegments(
// 		segmentId: number,
// 		interests: INTEREST[],
// 	): Promise<InterestSegmentDto[]> {
// 		return Promise.all(interests.map(interest => this.generateInterestSegment(segmentId, interest)))
// 	}

// 	async generateInterestSegment(
// 		segmentId: number,
// 		interest: INTEREST,
// 	): Promise<InterestSegmentDto> {
// 		const { messages, maxTokens } = await this.promptBuilder.buildInterestTemplate(
// 			segmentId,
// 			interest,
// 		)

// 		let lastError: unknown
// 		for (let attempt = 1; attempt <= OpenAiSegmentsAdapter.MAX_RETRIES; attempt++) {
// 			try {
// 				const res = await this.client.chat.completions.create({
// 					model: this.config.openai.model,
// 					max_tokens: maxTokens,
// 					messages,
// 				})
// 				const text = res.choices[0]?.message?.content ?? '{}'
// 				this.logger.debug(`Attempt ${attempt}: LLM response text: ${text}`)

// 				const parsed = JSON.parse(text) as unknown
// 				if (this.isInterestSegmentDto(parsed)) {
// 					return parsed
// 				}

// 				this.logger.warn(
// 					`Attempt ${attempt}: AI returned malformed interest-segment output, retrying...`,
// 					parsed,
// 				)
// 			} catch (err) {
// 				lastError = err
// 				this.logger.error(`Attempt ${attempt}: LLM error in generateInterestSegment`, err)
// 			}
// 		}

// 		this.logger.error(
// 			`All ${OpenAiSegmentsAdapter.MAX_RETRIES} attempts failed for generateInterestSegment`,
// 			lastError,
// 		)
// 		throw new InternalServerErrorException('AI interest segment generation failed after retries')
// 	}

// 	async splitSegments(segmentId: number, count?: number): Promise<AdapterSegmentDto[]> {
// 		const { messages, maxTokens } = await this.promptBuilder.buildSplitTemplate(segmentId, count)

// 		let lastError: unknown
// 		for (let attempt = 1; attempt <= OpenAiSegmentsAdapter.MAX_RETRIES; attempt++) {
// 			try {
// 				const res = await this.client.chat.completions.create({
// 					model: this.config.openai.model,
// 					max_tokens: maxTokens,
// 					messages,
// 				})
// 				const raw = res.choices[0]?.message?.content ?? '[]'
// 				this.logger.debug(`Attempt ${attempt}: raw splitSegments text: ${raw}`)

// 				const cleaned = raw
// 					.trim()
// 					.replace(/^```(?:json)?\s*/i, '')
// 					.replace(/\s*```$/i, '')
// 				const parsed = JSON.parse(cleaned) as unknown

// 				if (this.isAdapterSegmentDtoArray(parsed)) {
// 					return parsed
// 				}

// 				this.logger.warn(
// 					`Attempt ${attempt}: AI returned malformed splitSegments output, retrying...`,
// 					parsed,
// 				)
// 			} catch (err) {
// 				lastError = err
// 				this.logger.error(`Attempt ${attempt}: LLM error in splitSegments`, err)
// 			}
// 		}

// 		this.logger.error(
// 			`All ${OpenAiSegmentsAdapter.MAX_RETRIES} attempts failed for splitSegments`,
// 			lastError,
// 		)
// 		throw new InternalServerErrorException('AI split operation failed after retries')
// 	}

// 	async mergeSegments(moduleId: number, segmentIds: number[]): Promise<AdapterSegmentDto[]> {
// 		const { messages, maxTokens } = await this.promptBuilder.buildMergeTemplate(segmentIds)

// 		let lastError: unknown
// 		for (let attempt = 1; attempt <= OpenAiSegmentsAdapter.MAX_RETRIES; attempt++) {
// 			try {
// 				const res = await this.client.chat.completions.create({
// 					model: this.config.openai.model,
// 					max_tokens: maxTokens,
// 					messages,
// 				})
// 				const raw = res.choices[0]?.message?.content ?? ''
// 				this.logger.debug(`Attempt ${attempt}: raw mergeSegments text: ${raw}`)

// 				const cleaned = raw
// 					.trim()
// 					.replace(/^```(?:json)?\s*/i, '')
// 					.replace(/\s*```$/i, '')
// 				const parsed = JSON.parse(cleaned) as unknown

// 				if (this.isAdapterSegmentDto(parsed)) {
// 					return [parsed]
// 				}

// 				this.logger.warn(
// 					`Attempt ${attempt}: AI returned malformed mergeSegments output, retrying...`,
// 					parsed,
// 				)
// 			} catch (err) {
// 				lastError = err
// 				this.logger.error(`Attempt ${attempt}: LLM error in mergeSegments`, err)
// 			}
// 		}

// 		this.logger.error(
// 			`All ${OpenAiSegmentsAdapter.MAX_RETRIES} attempts failed for mergeSegments`,
// 			lastError,
// 		)
// 		throw new InternalServerErrorException('AI merge operation failed after retries')
// 	}

// 	/**
// 	 * Type guard: checks whether `obj` is an AdapterSegmentDto.
// 	 */
// 	private isAdapterSegmentDto(obj: unknown): obj is AdapterSegmentDto {
// 		if (typeof obj !== 'object' || obj === null) {
// 			return false
// 		}
// 		const record = obj as Record<string, unknown>

// 		return (
// 			typeof record.title === 'string' &&
// 			typeof record.theoryContent === 'string' &&
// 			typeof record.order === 'number' &&
// 			typeof record.timeToComplete === 'number' &&
// 			typeof record.status === 'string' &&
// 			// runtime check that `status` is a valid APPROVAL_STATUS
// 			Object.values(APPROVAL_STATUS).includes(record.status as APPROVAL_STATUS)
// 		)
// 	}

// 	private isInterestSegmentDto(obj: unknown): obj is InterestSegmentDto {
// 		if (typeof obj !== 'object' || obj === null) {
// 			return false
// 		}
// 		const record = obj as Record<string, unknown>

// 		return (
// 			typeof record.theoryContent === 'string' &&
// 			typeof record.interest === 'string' &&
// 			// runtime check that `interest` is a valid INTEREST
// 			Object.values(INTEREST).includes(record.interest as INTEREST)
// 		)
// 	}

// 	/**
// 	 * Type guard: checks whether `arr` is an array of AdapterSegmentDto.
// 	 */
// 	private isAdapterSegmentDtoArray(arr: unknown): arr is AdapterSegmentDto[] {
// 		if (!Array.isArray(arr)) {
// 			return false
// 		}
// 		return arr.every(item => this.isAdapterSegmentDto(item))
// 	}

// 	private isInterestSegmentDtoArray(arr: unknown): arr is InterestSegmentDto[] {
// 		if (!Array.isArray(arr)) {
// 			return false
// 		}
// 		return arr.every(item => this.isInterestSegmentDto(item))
// 	}
// }
