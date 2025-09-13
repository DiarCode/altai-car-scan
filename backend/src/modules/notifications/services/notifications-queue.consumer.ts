import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { BossService } from 'src/common/queue/boss.service'
import { NotificationsApi } from '../notifications.service'

type Job<T = unknown> = { data: T }

@Injectable()
export class NotificationsQueueConsumer implements OnModuleInit {
	private readonly logger = new Logger(NotificationsQueueConsumer.name)

	constructor(
		private readonly boss: BossService,
		private readonly notifications: NotificationsApi,
	) {}

	async onModuleInit() {
		// If pg-boss didn't start (e.g., missing DATABASE_URL), skip subscriptions gracefully
		if (!this.boss.instance) {
			this.logger.warn('pg-boss not started; skipping notifications queue subscriptions')
			return
		}

		const subscribe = async <T>(queue: string, handler: (data: T) => Promise<void>) => {
			await this.boss.subscribe(queue, async (job: Job<T>) => {
				const data: T = job?.data
				this.logger.debug(`[${queue}] job received: ${JSON.stringify(data)}`)
				try {
					await handler(data)
					this.logger.debug(`[${queue}] job processed successfully`)
				} catch (e) {
					this.logger.warn(`Handler failed for ${queue}: ${e}`)
					throw e
				}
			})
			this.logger.log(`Subscribed to ${queue}`)
		}

		await Promise.all([
			subscribe<{
				learnerId: number
				data?: {
					wordsLearnt?: number
					exercises?: { completed: number; failed: number }
					progress?: { dailyTasksCompleted: number; days: number }
					summary?: string
				}
			}>('notifications.weekly-summary', async d => {
				await this.notifications.weeklySummary(d.learnerId, d.data)
			}),
			subscribe<{ learnerId: number }>('notifications.free-chat-nudge', async d => {
				await this.notifications.freeChatNudge(d.learnerId)
			}),
			subscribe<{ learnerId: number; sessionId?: string }>(
				'notifications.chat-inactivity-nudge',
				async d => {
					await this.notifications.chatInactivityNudge(d.learnerId, d.sessionId)
				},
			),
			subscribe<{ learnerId: number; data?: Record<string, any> }>(
				'notifications.daily-task-incomplete',
				async d => {
					await this.notifications.dailyTaskIncomplete(d.learnerId, d.data)
				},
			),
			subscribe<{ learnerId: number; count: number }>('notifications.vocab-review-due', async d => {
				await this.notifications.vocabReviewDue(d.learnerId, d.count)
			}),
		])
	}
}
