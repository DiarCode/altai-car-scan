import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { FreeChatService } from './free-chat.service'
import {
	FreeChatMessagesResponseDto,
	SendFreeChatMessageDto,
	FreeChatMessageDto,
	FreeChatMessagesQuery,
} from './dtos/free-chat.dtos'

@ApiTags('Free Chat')
@Controller('free-chat')
@UseGuards(LearnerAuthGuard)
export class FreeChatController {
	constructor(private readonly freeChatService: FreeChatService) {}

	@Get('messages')
	@ApiOperation({ summary: 'Get free chat messages for the learner with pagination' })
	@ApiResponse({ status: 200, type: FreeChatMessagesResponseDto })
	async getMessages(
		@GetCurrentLearner() learner: LearnerClaims,
		@Query() query: FreeChatMessagesQuery,
	): Promise<FreeChatMessagesResponseDto> {
		return this.freeChatService.getMessages(learner.id, query)
	}

	@Post('messages')
	@ApiOperation({ summary: 'Send a message in the free chat session' })
	@ApiResponse({ status: 200, type: FreeChatMessageDto })
	async sendMessage(
		@GetCurrentLearner() learner: LearnerClaims,
		@Body() dto: SendFreeChatMessageDto,
	): Promise<FreeChatMessageDto> {
		return this.freeChatService.sendMessage(learner.id, dto)
	}
}
