import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'
import { BossService } from 'src/common/queue/boss.service'

@Injectable()
export class VocabReviewScheduler {
	private readonly logger = new Logger(VocabReviewScheduler.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly boss: BossService,
	) {}

	// Every morning at 8 AM
	@Cron(CronExpression.EVERY_DAY_AT_8AM)
	async sendDueReviewReminders() {
		const now = new Date()
		// Count due words per learner
		const due = await this.prisma.learnerVocabularyProgress.findMany({
			where: { nextReviewAt: { lte: now } },
			select: { learnerId: true },
		})

		const counts = new Map<number, number>()
		for (const row of due) {
			counts.set(row.learnerId, (counts.get(row.learnerId) ?? 0) + 1)
		}

		for (const [learnerId, count] of counts.entries()) {
			try {
				await this.boss.publish('notifications.vocab-review-due', {
					learnerId,
					count,
				})
			} catch (e) {
				this.logger.debug(`vocabReviewDue failed for ${learnerId}: ${e}`)
			}
		}
	}
}
