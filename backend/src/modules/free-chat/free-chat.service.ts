import { Injectable, Inject } from '@nestjs/common'
import { FreeChatSessionService } from './services/free-chat-session.service'
import { FreeChatMessageService } from './services/free-chat-message.service'
import { FreeChatLLMAdapter } from './adapters/free-chat-llm.adapter.interface'
import {
	FreeChatMessagesResponseDto,
	SendFreeChatMessageDto,
	FreeChatMessageDto,
	FreeChatMessagesQuery,
} from './dtos/free-chat.dtos'
import { FreeChatSenderType } from './types/free-chat.types'
import { AppConfigService } from 'src/common/config/config.service'
import { LearnerProfileService } from '../auth/learner/services/learner-profile.service'

const LEARNING_FREE_CHAT_SCOPE =
	'This is a free chat session for learners to practice Kazakh language skills.'

@Injectable()
export class FreeChatService {
	constructor(
		private readonly freeChatSessionService: FreeChatSessionService,
		private readonly freeChatMessageService: FreeChatMessageService,
		private readonly configService: AppConfigService,
		@Inject('FreeChatLLMAdapter')
		private readonly llmAdapter: FreeChatLLMAdapter,
		private readonly learnerProfileService: LearnerProfileService,
	) {}

	async getMessages(
		learnerId: number,
		query: FreeChatMessagesQuery,
	): Promise<FreeChatMessagesResponseDto> {
		let freeChat = await this.freeChatSessionService.getFreeChatByLearnerId(learnerId)

		if (!freeChat) {
			freeChat = await this.freeChatSessionService.createFreeChat(learnerId)
		}

		const { messages, hasMore, totalCount } = await this.freeChatMessageService.getFreeChatMessages(
			String(freeChat.id),
			query,
		)

		return {
			messages: messages,
			hasMore,
			totalCount,
		}
	}

	async sendMessage(learnerId: number, dto: SendFreeChatMessageDto): Promise<FreeChatMessageDto> {
		let freeChat = await this.freeChatSessionService.getFreeChatByLearnerId(learnerId)

		if (!freeChat) {
			freeChat = await this.freeChatSessionService.createFreeChat(learnerId)
		}

		// Save user message
		await this.freeChatMessageService.createFreeChatMessage({
			freeChatId: String(freeChat.id),
			content: dto.content,
			role: FreeChatSenderType.USER,
		})

		// Prepare context for AI response
		// This should include relevant learning content, struggles, known words, etc.
		const previousMessages = await this.freeChatMessageService.getLastFiveMessages(
			String(freeChat.id),
		)

		const learner = await this.learnerProfileService.getById(learnerId)

		const context = {
			// learningContent: '...',
			// latestStruggles: '...',
			// knownWords: learnerVocabulary || [],
			learnerInterests: learner.interests || [],
			learnerLanguage: learner.nativeLanguage || 'KAZAKH',
			scope: LEARNING_FREE_CHAT_SCOPE,
			previousMessages: previousMessages,
		}

		// Generate AI response
		const aiResponse = await this.llmAdapter.generateResponse(dto.content, context)

		// Save AI response
		const aiMessage = await this.freeChatMessageService.createFreeChatMessage({
			freeChatId: String(freeChat.id),
			content: aiResponse.content,
			role: FreeChatSenderType.SYSTEM,
		})

		return this.freeChatMessageService.mapMessageToDto(aiMessage)
	}
}
