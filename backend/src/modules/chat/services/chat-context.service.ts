// src/modules/chat/services/chat-context.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { ChatContext } from '../adapters/chat-llm-adapter.interface'
import { ChatContextScope } from '../types/chat-flow.types'
import { ChatSessionDocument } from '../schemas/chat-session.schema'
import { ChatMessageService } from './chat-message.service'
import { NATIVE_LANGUAGE } from '@prisma/client'
import { ContentService } from './content.service'

@Injectable()
export class ChatContextService {
	private readonly logger = new Logger(ChatContextService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly chatMessageService: ChatMessageService,
		private readonly learnerContentService: ContentService,
	) {}

	/**
	 * Build comprehensive context for LLM
	 */
	async buildChatContext(
		session: ChatSessionDocument,
		scope: ChatContextScope,
		includeRAG: boolean = true,
	): Promise<ChatContext> {
		const { learnerId, learningContext } = session
		const { moduleId, currentSegmentId, currentExerciseId } = learningContext

		// Get learner info
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: {
				nativeLanguage: true,
				interests: true,
			},
		})

		if (!learner) {
			throw new Error(`Learner ${learnerId} not found`)
		}

		// Get conversation history
		const previousMessages = await this.chatMessageService.getConversationHistory(
			session.sessionId,
			learnerId,
			10,
		)

		// Get current content based on scope
		const currentContent = await this.getCurrentContent(
			moduleId,
			learner.nativeLanguage,
			currentSegmentId,
			currentExerciseId,
		)

		// Get RAG context if needed
		let ragContext = undefined
		if (includeRAG) {
			ragContext = undefined
		}

		return {
			learnerId,
			moduleId,
			segmentId: currentSegmentId,
			exerciseId: currentExerciseId,
			learnerLanguage: learner.nativeLanguage,
			learnerInterests: learner.interests,
			scope,
			previousMessages,
			currentContent: await this.enrichCurrentContent(currentContent, session),
			ragContext,
			_internalSession: session,
		}
	}

	private async enrichCurrentContent(
		base: ChatContext['currentContent'],
		session: ChatSessionDocument,
	): Promise<ChatContext['currentContent']> {
		if (!base) return base
		// interest segment content
		if (session.learningContext.currentInterestSegmentId) {
			try {
				const iseg = await this.prisma.interestSegment.findUnique({
					where: { id: session.learningContext.currentInterestSegmentId },
					select: { theoryContent: true },
				})
				if (iseg) base.interestSegmentContent = iseg.theoryContent
			} catch {
				// ignore interest segment fetch errors
			}
		}
		// module vocabulary (list of words)
		try {
			const vocab = await this.prisma.moduleVocabulary.findMany({
				where: { moduleId: session.learningContext.moduleId },
				select: { word: true },
				orderBy: { id: 'asc' },
				take: 50,
			})
			base.moduleVocabulary = vocab.map(v => v.word)
		} catch {
			// ignore vocabulary fetch errors
		}
		return base
	}

	/**
	 * Get current content based on learning context
	 */
	private async getCurrentContent(
		moduleId: number,
		learnerLanguage: NATIVE_LANGUAGE,
		segmentId?: number,
		exerciseId?: number,
	): Promise<ChatContext['currentContent']> {
		const content: ChatContext['currentContent'] = {}

		// Get module info
		const module = await this.prisma.module.findUnique({
			where: { id: moduleId },
			select: {
				title: true,
				theoryContent: true,
				description: true,
			},
		})

		if (module) {
			content.moduleTitle = module.title
		}

		// Get segment info if available
		if (segmentId) {
			try {
				const segmentDetail = await this.learnerContentService.getSegmentDetailForLearner(
					segmentId,
					learnerLanguage,
				)

				content.segmentTitle = segmentDetail.title
				content.segmentContent = segmentDetail.theoryContent
			} catch (error) {
				this.logger.warn(`Could not get segment ${segmentId} detail:`, error)
			}
		}

		// Get exercise info if available
		if (exerciseId) {
			try {
				const exercise = await this.prisma.exercise.findUnique({
					where: { id: exerciseId },
					include: {
						ExerciseTranslation: true,
						interestSegment: true,
					},
				})

				if (exercise) {
					// Get translated exercise if available
					const translatedExercises = await this.learnerContentService.getExercisesForLearner(
						exercise.interestSegmentId,
						learnerLanguage,
					)

					const translatedExercise = translatedExercises.find(e => e.id === exerciseId)
					if (translatedExercise) {
						content.exerciseTitle = translatedExercise.title
						content.exerciseContent = translatedExercise
					}
				}
			} catch (error) {
				this.logger.warn(`Could not get exercise ${exerciseId} detail:`, error)
			}
		}

		return content
	}

	/**
	 * Get RAG context (placeholder for now - will be implemented with knowledge base)
	 */
	private async getRagContext(
		scope: ChatContextScope,
		currentContent?: ChatContext['currentContent'],
	): Promise<ChatContext['ragContext']> {
		if (scope !== ChatContextScope.KAZAKH_LANGUAGE) {
			return undefined // RAG context only relevant for Kazakh language scope
		}
		// For now, return undefined - in production, implement RAG context retrieval
		if (!currentContent || !currentContent.moduleTitle) {
			return undefined
		}
		await Promise.resolve()
		// TODO: Implement RAG context retrieval from knowledge base
		return undefined
	}

	/**
	 * Determine appropriate scope based on user message
	 */
	async determineScopeFromMessage(
		userMessage: string,
		session: ChatSessionDocument,
	): Promise<ChatContextScope> {
		await Promise.resolve()
		const lowerMessage = userMessage.toLowerCase()

		// TODO: Implement more sophisticated NLP analysis if needed
		// Check for exercise-specific keywords
		if (
			session.learningContext.currentExerciseId &&
			(lowerMessage.includes('this exercise') ||
				lowerMessage.includes('this question') ||
				lowerMessage.includes('current exercise'))
		) {
			return ChatContextScope.CURRENT_EXERCISE
		}

		// Check for segment-specific keywords
		if (
			session.learningContext.currentSegmentId &&
			(lowerMessage.includes('this lesson') ||
				lowerMessage.includes('this segment') ||
				lowerMessage.includes('current lesson'))
		) {
			return ChatContextScope.CURRENT_SEGMENT
		}

		// Check for module-specific keywords
		if (lowerMessage.includes('this module') || lowerMessage.includes('this course')) {
			return ChatContextScope.CURRENT_MODULE
		}

		// Check for Kazakh language keywords
		const kazakhKeywords = [
			'kazakh',
			'қазақ',
			'grammar',
			'pronunciation',
			'vocabulary',
			'translate',
			'meaning',
			'how to say',
			'conjugation',
			'declension',
		]
		if (kazakhKeywords.some(keyword => lowerMessage.includes(keyword))) {
			return ChatContextScope.KAZAKH_LANGUAGE
		}

		// Check for general learning keywords
		const learningKeywords = [
			'learn',
			'study',
			'practice',
			'understand',
			'explain',
			'help',
			'difficult',
			'easy',
			'remember',
			'memorize',
		]
		if (learningKeywords.some(keyword => lowerMessage.includes(keyword))) {
			return ChatContextScope.GENERAL_LEARNING
		}

		// Default to current context based on session state
		if (session.learningContext.currentExerciseId) {
			return ChatContextScope.CURRENT_EXERCISE
		} else if (session.learningContext.currentSegmentId) {
			return ChatContextScope.CURRENT_SEGMENT
		} else {
			return ChatContextScope.CURRENT_MODULE
		}
	}

	/**
	 * Validate if message is appropriate for current context
	 */
	async validateMessageScope(
		userMessage: string,
		session: ChatSessionDocument,
		scope: ChatContextScope,
	): Promise<{
		isValid: boolean
		reason?: string
		suggestedScope?: ChatContextScope
	}> {
		// TODO: Implement more sophisticated validation logic if needed
		await Promise.resolve()
		// Basic validation - all language learning related questions are valid
		const lowerMessage = userMessage.toLowerCase()

		// Check for inappropriate content
		const inappropriateKeywords = ['politics', 'religion', 'controversial', 'offensive']

		if (inappropriateKeywords.some(keyword => lowerMessage.includes(keyword))) {
			return {
				isValid: false,
				reason: 'This question is not related to language learning',
				suggestedScope: ChatContextScope.KAZAKH_LANGUAGE,
			}
		}

		// Check if question is too broad for current scope
		if (scope === ChatContextScope.CURRENT_EXERCISE && lowerMessage.includes('all exercises')) {
			return {
				isValid: true,
				reason: 'Question is broader than current exercise',
				suggestedScope: ChatContextScope.CURRENT_SEGMENT,
			}
		}

		// All other questions are valid
		return {
			isValid: true,
		}
	}

	/**
	 * Get context summary for debugging
	 */
	async getContextSummary(
		session: ChatSessionDocument,
		scope: ChatContextScope,
	): Promise<{
		sessionId: string
		learnerId: number
		moduleId: number
		segmentId?: number
		exerciseId?: number
		scope: ChatContextScope
		hasCurrentContent: boolean
		messageHistoryCount: number
	}> {
		const context = await this.buildChatContext(session, scope, false)

		return {
			sessionId: session.sessionId,
			learnerId: session.learnerId,
			moduleId: session.learningContext.moduleId,
			segmentId: session.learningContext.currentSegmentId,
			exerciseId: session.learningContext.currentExerciseId,
			scope,
			hasCurrentContent: !!context.currentContent,
			messageHistoryCount: context.previousMessages.length,
		}
	}
}
