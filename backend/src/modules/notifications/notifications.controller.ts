import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { BaseNotificationDto, NotificationsFilter } from './dtos/notifications.dtos'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { WeeklySummaryService } from './services/weekly-summary.service'
import { WeeklySummaryDto } from './dtos/weekly-summary.dto'

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(LearnerAuthGuard)
export class NotificationsController {
	constructor(
		private readonly svc: NotificationsService,
		private readonly weekly: WeeklySummaryService,
	) {}

	@Get()
	async list(
		@GetCurrentLearner() learner: LearnerClaims,
		@Query() filter: NotificationsFilter,
	): Promise<PaginatedResponse<BaseNotificationDto>> {
		return this.svc.listForLearner(learner.id, filter)
	}

	@Patch(':id/read')
	async read(@GetCurrentLearner() learner: LearnerClaims, @Param('id', ParseIntPipe) id: number) {
		await this.svc.markRead(learner.id, id)
		return { ok: true }
	}

	@Get('weekly-summary')
	async getLatestWeeklySummary(
		@GetCurrentLearner() learner: LearnerClaims,
	): Promise<WeeklySummaryDto> {
		return this.weekly.getCurrentWeekSummary(learner.id)
	}
}
