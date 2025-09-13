import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ChatSession, ChatSessionDocument } from '../schemas/chat-session.schema'
import { ChatSessionStatus } from '../types/chat-flow.types'
import { BossService } from 'src/common/queue/boss.service'

@Injectable()
export class ChatInactivityScheduler {
	private readonly logger = new Logger(ChatInactivityScheduler.name)

	constructor(
		@InjectModel(ChatSession.name)
		private readonly chatSessionModel: Model<ChatSessionDocument>,
		private readonly boss: BossService,
	) {}

	// Twice a day
	@Cron(CronExpression.EVERY_DAY_AT_9AM)
	@Cron(CronExpression.EVERY_DAY_AT_6PM)
	async nudgeInactiveSessions() {
		const cutoff = new Date()
		cutoff.setHours(cutoff.getHours() - 12)

		const sessions = await this.chatSessionModel
			.find({ status: ChatSessionStatus.ACTIVE, 'learningContext.lastActivityAt': { $lt: cutoff } })
			.select({ sessionId: 1, learnerId: 1 })
			.exec()

		this.logger.log(`Chat inactivity nudge sessions: ${sessions.length}`)
		for (const s of sessions) {
			try {
				await this.boss.publish('notifications.chat-inactivity-nudge', {
					learnerId: s.learnerId,
					sessionId: s.sessionId,
				})
			} catch (e) {
				this.logger.warn(`Failed to send inactivity nudge for ${s.sessionId}: ${e}`)
			}
		}
	}
}
