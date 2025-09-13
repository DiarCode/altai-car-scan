import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'
import { BossService } from 'src/common/queue/boss.service'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import {
	FreeChatMessage,
	FreeChatMessageDocument,
	FreeChat,
	FreeChatDocument,
} from '../schemas/free-chat.schema'
import { FreeChatSenderType } from '../types/free-chat.types'

@Injectable()
export class FreeChatNudgeScheduler {
	private readonly logger = new Logger(FreeChatNudgeScheduler.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly boss: BossService,
		@InjectModel(FreeChatMessage.name)
		private readonly freeChatMessageModel: Model<FreeChatMessageDocument>,
		@InjectModel(FreeChat.name)
		private readonly freeChatModel: Model<FreeChatDocument>,
	) {}

	// Every day at 10:00 local server time
	@Cron(CronExpression.EVERY_DAY_AT_10AM)
	@Cron('0 10 * * *')
	async sendFreeChatNudges() {
		// Nudge learners who haven't sent any free chat messages in the last 3 days
		const since = new Date()
		since.setDate(since.getDate() - 3)

		// Get distinct freeChatIds with recent user messages
		type IdRow = { _id: string }
		const idRows = await this.freeChatMessageModel
			.aggregate<IdRow>([
				{ $match: { createdAt: { $gte: since }, role: FreeChatSenderType.USER } },
				{ $group: { _id: '$freeChatId' } },
			])
			.exec()

		const objIds = idRows
			.map(r => {
				try {
					return new Types.ObjectId(r._id)
				} catch {
					return null
				}
			})
			.filter((v): v is Types.ObjectId => v !== null)

		const chats = await this.freeChatModel
			.find({ _id: { $in: objIds } })
			.select({ learnerId: 1 })
			.exec()
		const activeLearnerIds = chats.map(c => c.learnerId)

		// All learners registered in the platform
		const learners = await this.prisma.learner.findMany({ select: { id: true } })
		const targetIds = learners.filter(l => !activeLearnerIds.includes(l.id)).map(l => l.id)

		this.logger.log(`Free chat nudge targets: ${targetIds.length}`)
		for (const learnerId of targetIds) {
			try {
				await this.boss.publish('notifications.free-chat-nudge', { learnerId })
			} catch (e) {
				this.logger.warn(`Failed to send free chat nudge to ${learnerId}: ${e}`)
			}
		}
	}
}
