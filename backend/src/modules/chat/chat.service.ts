import { Injectable, Logger, BadRequestException, Inject, NotFoundException } from '@nestjs/common'
import { ChatMessageService } from './services/chat-message.service'
import { ChatSessionService } from './services/chat-session.service'
import { ChatContextService } from './services/chat-context.service'
import { ChatLLMAdapter } from './adapters/chat-llm-adapter.interface'
import {
	ChatSessionType,
	ChatMessageType,
	ChatActionType,
	ChatFlowState,
} from './types/chat-flow.types'
import {
	SendChatMessageDto,
	SendCommandDto,
	SubmitExerciseAnswerDto,
	ChatMessagesQueryDto,
	ChatMessagesResponseDto,
	ChatResponseDto,
	ChatSessionDto, // Added ChatSessionDto
} from './dtos/chat.dtos'
import { ContentService } from './services/content.service'
import { ChatFlowService } from './services/chat-flow.service'
import { VocabularyService } from './services/vocabulary.service'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { ProficiencyLevelsService } from '../proficiency-levels/proficiency-levels.service'
import { ProficiencyLevelSummaryDto } from '../proficiency-levels/dtos/proficiency-level.dtos'
import { ModulesService } from '../modules/modules.service'
import { ModulesFilter, BaseModuleDto } from '../modules/dtos/modules.dtos'
import { ModuleDto } from './dtos/chat.dtos'
import { ChatSummarizationService } from './services/chat-summarization.service'
import { PronunciationASRService } from '../asr/pronunciation-asr.service'
import { BaseSubmitDto } from '../exercise-validation/dtos/submission.dtos'

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name)

	constructor(
		private readonly messageService: ChatMessageService,
		private readonly sessionService: ChatSessionService,
		private readonly contextService: ChatContextService,
		private readonly contentService: ContentService,
		private readonly chatFlowService: ChatFlowService,
		private readonly vocabularyService: VocabularyService,
		private readonly proficiencyLevelsService: ProficiencyLevelsService,
		private readonly modulesService: ModulesService,
		private readonly summarizationService: ChatSummarizationService,
		@Inject('ChatLLMAdapter')
		private readonly llmAdapter: ChatLLMAdapter,
		// added for pronunciation flow
		private readonly pronunciationAsrService?: PronunciationASRService,
	) {}

	// Minimal handler for pronunciation submissions from controller. Delegates to ChatFlowService where appropriate.
	async submitPronunciationExercise(
		learnerId: number,
		moduleId: number,
		file: Express.Multer.File,
		body: BaseSubmitDto,
	): Promise<ChatResponseDto> {
		// Defer to ChatFlowService if it supports a unified submission path
		if (
			this.chatFlowService &&
			typeof this.chatFlowService.submitPronunciationAnswer === 'function'
		) {
			return this.chatFlowService.submitPronunciationAnswer(learnerId, moduleId, file, body)
		}
		// Fallback: return a simple not implemented style response until chat flow supports it
		throw new Error('Pronunciation submission not implemented in chat flow')
	}

	async getModulesForLearner(learnerId: number) {
		return this.contentService.getModulesForLearner(learnerId)
	}

	async getAllModulesForLearner(learnerId: number, query: ModulesFilter): Promise<ModuleDto[]> {
		return this.contentService.getAllModulesList(learnerId, query)
	}

	async getAllProficiencyLevelsWithModulesForLearner(): Promise<ProficiencyLevelSummaryDto[]> {
		return this.proficiencyLevelsService.findAll()
	}

	async getLatestModuleForLearner(learnerId: number): Promise<ModuleDto> {
		const latestSession = await this.sessionService.getLatestRelevantSessionByLearner(learnerId)

		if (!latestSession) {
			// Scenario A: No active or completed sessions found, return the first module
			return this.contentService.getFirstApprovedModuleForLearner(learnerId)
		}

		if (latestSession.state === ChatFlowState.MODULE_COMPLETE) {
			// Scenario C: Latest session is complete, return the next module
			const nextModuleInLevel = await this.contentService.getNextApprovedModuleForLearner(
				learnerId,
				latestSession.learningContext.moduleId,
			)

			if (nextModuleInLevel) {
				// If there's a next module in the same level, return it
				await this.sessionService.updateLearningContext(latestSession.sessionId, {
					nextModuleId: nextModuleInLevel.id,
				})
				return nextModuleInLevel
			} else {
				// If no more modules in current proficiency level, go to next proficiency level
				const currentModule = await this.contentService.getModuleById(
					latestSession.learningContext.moduleId,
				)
				const nextProficiencyLevel = await this.proficiencyLevelsService.getNextProficiencyLevel(
					currentModule.level.id,
				)

				if (nextProficiencyLevel) {
					// Get the first module of the next proficiency level
					const firstModuleInNextLevel =
						await this.contentService.getFirstApprovedModuleForProficiencyLevel(
							nextProficiencyLevel.id,
						)
					if (firstModuleInNextLevel) {
						await this.sessionService.updateLearningContext(latestSession.sessionId, {
							nextModuleId: firstModuleInNextLevel.id,
						})
						return firstModuleInNextLevel
					}
				}
				// If no next module or next proficiency level, return the last module (learner completed all modules)
				const lastModule = await this.contentService.getLastApprovedModuleForLearner(learnerId)
				await this.sessionService.updateLearningContext(latestSession.sessionId, {
					nextModuleId: undefined, // No next module available
				})
				return lastModule
			}
		} else {
			// Scenario B: Latest session exists and is not complete, return its module
			const currentModule = await this.contentService.getModuleForLearnerWithCompletionStatus(
				learnerId,
				latestSession.learningContext.moduleId,
			)

			// Also calculate nextModuleId for the current session's context
			const nextModuleInLevel = await this.contentService.getNextApprovedModuleForLearner(
				learnerId,
				currentModule.id,
			)
			let nextModuleId: number | null = null
			if (nextModuleInLevel) {
				nextModuleId = nextModuleInLevel.id
			} else {
				const currentModuleData = await this.contentService.getModuleById(currentModule.id)
				const nextProficiencyLevel = await this.proficiencyLevelsService.getNextProficiencyLevel(
					currentModuleData.level.id,
				)
				if (nextProficiencyLevel) {
					const firstModuleInNextLevel =
						await this.contentService.getFirstApprovedModuleForProficiencyLevel(
							nextProficiencyLevel.id,
						)
					if (firstModuleInNextLevel) {
						nextModuleId = firstModuleInNextLevel.id
					}
				}
			}
			await this.sessionService.updateLearningContext(latestSession.sessionId, {
				nextModuleId: nextModuleId ?? undefined,
			})
			return currentModule
		}
	}

	async startOrGetSession(learnerId: number, moduleId: number): Promise<ChatSessionDto> {
		const moduleData: BaseModuleDto = await this.contentService.getModuleById(moduleId)

		// Determine nextModuleId for the new session
		const nextModuleInLevel = await this.contentService.getNextApprovedModuleForLearner(
			learnerId,
			moduleId,
		)
		let nextModuleId: number | null = null
		if (nextModuleInLevel) {
			nextModuleId = nextModuleInLevel.id
		} else {
			const nextProficiencyLevel = await this.proficiencyLevelsService.getNextProficiencyLevel(
				moduleData.level.id,
			)
			if (nextProficiencyLevel) {
				const firstModuleInNextLevel =
					await this.contentService.getFirstApprovedModuleForProficiencyLevel(
						nextProficiencyLevel.id,
					)
				if (firstModuleInNextLevel) {
					nextModuleId = firstModuleInNextLevel.id
				}
			}
		}

		const session = await this.sessionService.getOrCreateActiveSession(
			learnerId,
			moduleId,
			moduleData,
			ChatSessionType.LEARNING_FLOW,
			nextModuleId ?? undefined, // Pass nextModuleId to the session service
		)

		if (session.messages.length === 0) {
			await this.chatFlowService.beginModule(learnerId, moduleId)
		}

		return this.sessionService.mapSessionToDto(session)
	}

	async getMessages(
		learnerId: number,
		moduleId: number,
		query: ChatMessagesQueryDto,
	): Promise<ChatMessagesResponseDto> {
		const session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new NotFoundException('No active session found for this learner and module.')
		}

		query.sessionId = session.sessionId
		query.moduleId = moduleId
		query.learnerId = learnerId
		return this.messageService.getMessages(query)
	}

	async getNextSegment(learnerId: number, moduleId: number): Promise<ChatResponseDto> {
		return this.chatFlowService.getNextSegment(learnerId, moduleId)
	}

	async getNextExercise(learnerId: number, moduleId: number): Promise<ChatResponseDto> {
		return this.chatFlowService.getNextExercise(learnerId, moduleId)
	}

	async submitExerciseAnswer(
		learnerId: number,
		moduleId: number,
		dto: SubmitExerciseAnswerDto,
	): Promise<ChatResponseDto> {
		return this.chatFlowService.submitExerciseAnswer(learnerId, moduleId, dto)
	}

	async explainVocabulary(learner: LearnerClaims, dto: SendCommandDto): Promise<ChatResponseDto> {
		return this.vocabularyService.explainVocabulary(learner, dto)
	}

	async memorizeVocabulary(learner: LearnerClaims, dto: SendCommandDto): Promise<ChatResponseDto> {
		return this.vocabularyService.memorizeVocabulary(learner, dto)
	}

	async sendMessage(
		learnerId: number,
		moduleId: number,
		dto: SendChatMessageDto,
	): Promise<ChatResponseDto> {
		const session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}

		const scope = await this.contextService.determineScopeFromMessage(dto.text, session)

		const validation = await this.contextService.validateMessageScope(dto.text, session, scope)
		if (!validation.isValid) {
			throw new BadRequestException(validation.reason)
		}

		// Save user message
		const userMessage = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId: session.learningContext.moduleId,
			type: dto.type || ChatMessageType.USER_QUESTION,
			content: dto.text,
			priority: dto.priority,
		})

		// Summarize older conversation if thresholds reached (updates session doc)
		const refreshedSession = await this.summarizationService.ensureSummary(session)
		// Build context for LLM using possibly updated session
		const context = await this.contextService.buildChatContext(refreshedSession, scope)

		// Generate AI response
		const aiResponse = await this.llmAdapter.generateResponse(dto.text, context)

		// Save AI response
		const aiMessage = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId: session.learningContext.moduleId,
			type: ChatMessageType.AI_RESPONSE,
			content: aiResponse.content,
			aiMetadata: aiResponse.metadata,
			parentMessageId: String(userMessage._id),
		})

		// Update session stats
		// await this.sessionService.updateSessionStats(session.sessionId, {
		// 	totalMessages: 2,
		// 	userMessages: 1,
		// 	aiResponses: 1,
		// 	questionsAsked: 1,
		// 	averageResponseTime: aiResponse.metadata.responseTime,
		// })

		// Update session with last message
		await this.sessionService.updateSession(session.sessionId, {
			lastMessageId: String(aiMessage._id),
		})

		const response = new ChatResponseDto()
		response.message = this.messageService.mapMessageToDto(aiMessage)
		response.session = this.sessionService.mapSessionToDto(session)
		response.context = {
			scope,
			hasRAGContext: !!(context.ragContext && context.ragContext.length > 0),
			responseTime: aiResponse.metadata.responseTime,
			tokensUsed: aiResponse.metadata.tokensUsed,
		}
		response.allowedActions = [
			ChatActionType.NEXT_SEGMENT,
			ChatActionType.START_EXERCISE,
			ChatActionType.SUBMIT_ANSWER,
			ChatActionType.USE_COMMAND,
			ChatActionType.ASK_QUESTION,
		]
		return response
	}
}
