import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FreeChatMessageService } from './free-chat-message.service'
import { AppConfigService } from 'src/common/config/config.service'

@Injectable()
export class FreeChatArchiverService {
	private readonly logger = new Logger(FreeChatArchiverService.name)

	constructor(
		private readonly freeChatMessageService: FreeChatMessageService,
		private readonly configService: AppConfigService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Runs daily at midnight
	async handleCron() {
		this.logger.log('Starting free chat message archiving job...')
		const archiveIntervalDays = this.configService.freeChat.archiveIntervalDays
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - archiveIntervalDays)

		const result = await this.freeChatMessageService.archiveOldMessages(cutoffDate)
		this.logger.log(`Archived ${result.modifiedCount} free chat messages.`)
	}
}
