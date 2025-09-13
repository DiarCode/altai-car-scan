import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { NATIVE_LANGUAGE } from '@prisma/client'
import {
	WeeklySummaryAdapter,
	WeeklySummaryInput,
} from 'src/common/interfaces/weekly-summary.interface'

export interface WeeklyMetricsInput {
	wordsLearnt: number
	exercises: { completed: number; failed: number }
	progress: { dailyTasksCompleted: number; days: number }
}

@Injectable()
export class WeeklySummaryLlmService {
	private readonly logger = new Logger(WeeklySummaryLlmService.name)

	constructor(
		private readonly prisma: PrismaService,
		@Inject('WeeklySummaryAdapter')
		private readonly adapter: WeeklySummaryAdapter,
	) {}

	async generateForLearner(learnerId: number, metrics: WeeklyMetricsInput): Promise<string> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true, name: true },
		})

		const language = this.mapLanguage(learner?.nativeLanguage ?? NATIVE_LANGUAGE.ENGLISH)
		const name = learner?.name?.trim() || undefined

		const input: WeeklySummaryInput = {
			wordsLearnt: metrics.wordsLearnt,
			exercises: metrics.exercises,
			progress: metrics.progress,
			name,
			targetLanguage: language,
		}

		try {
			return await this.adapter.summarize(input)
		} catch (e) {
			this.logger.error('Adapter failed to generate weekly summary', e)
			throw new InternalServerErrorException('Failed to generate weekly summary')
		}
	}

	private mapLanguage(lang: NATIVE_LANGUAGE): 'Kazakh' | 'Russian' | 'English' {
		switch (lang) {
			case NATIVE_LANGUAGE.KAZAKH:
				return 'Kazakh'
			case NATIVE_LANGUAGE.RUSSIAN:
				return 'Russian'
			default:
				return 'English'
		}
	}
}
