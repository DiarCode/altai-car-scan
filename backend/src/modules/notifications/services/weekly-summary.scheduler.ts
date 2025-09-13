import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'
import { WeeklySummaryService } from './weekly-summary.service'
import { BossService } from 'src/common/queue/boss.service'
import { WeeklySummaryLlmService } from './weekly-summary-llm.service'

@Injectable()
export class WeeklySummaryScheduler {
	private readonly logger = new Logger(WeeklySummaryScheduler.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly weekly: WeeklySummaryService,
		private readonly weeklyLlm: WeeklySummaryLlmService,
		private readonly boss: BossService,
	) {}

	// Every Monday at 09:00 server time
	@Cron('0 9 * * 1')
	async sendWeeklySummaries() {
		const learners = await this.prisma.learner.findMany({ select: { id: true } })
		for (const l of learners) {
			try {
				const summary = await this.weekly.getCurrentWeekSummary(l.id)
				try {
					const text = await this.weeklyLlm.generateForLearner(l.id, {
						wordsLearnt: summary.wordsLearnt,
						exercises: summary.exercises,
						progress: summary.progress,
					})
					await this.boss.publish('notifications.weekly-summary', {
						learnerId: l.id,
						data: {
							wordsLearnt: summary.wordsLearnt,
							exercises: summary.exercises,
							progress: summary.progress,
							summary: text,
						},
					})
				} catch (err) {
					this.logger.warn(
						`Failed to generate/send LLM weekly summary for learner ${l.id}: ${String(err)}`,
					)
				}
			} catch (e) {
				this.logger.warn(`Weekly summary failed for learner ${l.id}: ${e}`)
			}
		}
	}
}
