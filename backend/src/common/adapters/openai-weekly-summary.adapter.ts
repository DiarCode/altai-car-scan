import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { AppConfigService } from 'src/common/config/config.service'
import {
	WeeklySummaryAdapter,
	WeeklySummaryInput,
} from 'src/common/interfaces/weekly-summary.interface'

@Injectable()
export class OpenAIWeeklySummaryAdapter implements WeeklySummaryAdapter {
	private static readonly MAX_RETRIES = 3
	private readonly logger = new Logger(OpenAIWeeklySummaryAdapter.name)
	private readonly client: OpenAI

	constructor(private readonly config: AppConfigService) {
		this.client = new OpenAI({ apiKey: config.openai.apiKey })
	}

	async summarize(input: WeeklySummaryInput): Promise<string> {
		const system = [
			'You are a friendly, concise language coach for a mobile app.',
			'Write a short weekly progress summary in the target language provided.',
			'Keep it 2–3 sentences, supportive, specific, and actionable.',
			'Avoid emojis and markdown; plain text only.',
		].join(' ')

		const user = [
			`Target language: ${input.targetLanguage}.`,
			input.name ? `Learner name: ${input.name}.` : undefined,
			`Words learnt: ${input.wordsLearnt}.`,
			`Exercises: completed ${input.exercises.completed}, failed ${input.exercises.failed}.`,
			`Daily tasks completed: ${input.progress.dailyTasksCompleted} out of ${input.progress.days}.`,
			'Write 2–3 sentences: 1) recognize the effort (optionally use the name if given), 2) highlight one concrete win, 3) give one simple tip for next week.',
		]
			.filter(Boolean)
			.join(' ')

		let lastError: unknown
		for (let attempt = 1; attempt <= OpenAIWeeklySummaryAdapter.MAX_RETRIES; attempt++) {
			try {
				const res = await this.client.chat.completions.create({
					model: this.config.openai.model,
					max_tokens: Math.min(this.config.openai.maxTokens, 200),
					temperature: 0.6,
					messages: [
						{ role: 'system', content: system },
						{ role: 'user', content: user },
					],
				})
				const text = (res.choices?.[0]?.message?.content ?? '').trim()
				if (text) return text
				this.logger.warn(`Empty LLM weekly summary (attempt ${attempt}); retrying…`)
			} catch (err) {
				lastError = err
				this.logger.error(`OpenAI error on attempt ${attempt}`, err)
			}
		}

		this.logger.error(
			`All ${OpenAIWeeklySummaryAdapter.MAX_RETRIES} attempts failed for weekly summary`,
			lastError,
		)
		throw new InternalServerErrorException('Failed to generate weekly summary')
	}
}
