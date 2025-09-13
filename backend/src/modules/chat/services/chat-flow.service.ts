// src/modules/chat/services/chat-flow.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ChatSessionService } from './chat-session.service'
import { ChatMessageService } from './chat-message.service'
import { ContentService } from './content.service'
import { ExerciseValidationFacadeService } from 'src/modules/exercise-validation/exercise-validation.facade.service'
import { FeedbackService } from './feedback.service'
import { LearnerProgressService } from './learner-progress.service'
import {
	ChatActionType,
	ChatFlowState,
	ChatMessageType,
	ChatContextScope,
	ExerciseAnswer, // Added
} from '../types/chat-flow.types'
import { ChatResponseDto, SubmitExerciseAnswerDto } from '../dtos/chat.dtos'
import { MessageReferenceType } from '../types/chat.types'
import { PrismaService } from 'src/prisma/prisma.service'
import { S3Service } from 'src/common/s3/s3.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ExerciseAttempt } from '../schemas/exercise-attempt.schema'
import { ExerciseAttemptDocument } from './learner-progress.service'
import { ChatFlowStateService } from './chat-flow-state.service'
import { ChatFlowContext } from '../types/chat-flow.types'
import { NATIVE_LANGUAGE, INTEREST } from '@prisma/client'
import { ChatSessionDocument } from '../schemas/chat-session.schema' // Added for session typing
import { ExerciseDto } from 'src/modules/exercises/dtos/exercises.dtos' // Added for exercise typing
import { SegmentDetailDto } from 'src/modules/segments/dtos/segments.dtos' // Added for segment typing
import { UserAnswer } from '../types/chat.types'
import { ChatMessageDocument } from '../schemas/chat-message.schema'
import { VocabularyService } from './vocabulary.service'
import { PronunciationASRService, AsrResult } from 'src/modules/asr/pronunciation-asr.service'
import { BaseSubmitDto } from 'src/modules/exercise-validation/dtos/submission.dtos'

const EXERCISES_PER_SEGMENT = 2
// Minimum score (inclusive) considered a passing / correct attempt. Adjust as needed.
const MIN_PASSING_SCORE = 70
// Maximum number of mistake entries listed in intervention summary
const MAX_INTERVENTION_MISTAKES = 5

@Injectable()
export class ChatFlowService {
	private readonly logger = new Logger(ChatFlowService.name)

	private readonly MESSAGES = {
		MODULE_WELCOME: {
			[NATIVE_LANGUAGE.ENGLISH]: (moduleTitle: string, segmentCount: number) =>
				`Welcome to the module: ${moduleTitle}. This module contains ${segmentCount} segments.`,
			[NATIVE_LANGUAGE.KAZAKH]: (moduleTitle: string, segmentCount: number) =>
				`Модульге қош келдіңіз: ${moduleTitle}. Бұл модульде ${segmentCount} сегмент бар.`,
			[NATIVE_LANGUAGE.RUSSIAN]: (moduleTitle: string, segmentCount: number) =>
				`Добро пожаловать в модуль: ${moduleTitle}. Этот модуль содержит ${segmentCount} сегментов.`,
		},
		NO_SEGMENTS_FOUND: {
			[NATIVE_LANGUAGE.ENGLISH]: (moduleId: number) =>
				`No published segments found for module ${moduleId}.`,
			[NATIVE_LANGUAGE.KAZAKH]: (moduleId: number) =>
				`Модуль ${moduleId} үшін жарияланған сегменттер табылмады.`,
			[NATIVE_LANGUAGE.RUSSIAN]: (moduleId: number) =>
				`Опубликованные сегменты для модуля ${moduleId} не найдены.`,
		},
		MODULE_COMPLETE: {
			[NATIVE_LANGUAGE.ENGLISH]: () =>
				'All segments in this module have been completed. Module is complete!',
			[NATIVE_LANGUAGE.KAZAKH]: () => 'Бұл модульдегі барлық сегменттер аяқталды. Модуль аяқталды!',
			[NATIVE_LANGUAGE.RUSSIAN]: () => 'Все сегменты в этом модуле завершены. Модуль завершен!',
		},
		NO_MORE_SEGMENTS: {
			[NATIVE_LANGUAGE.ENGLISH]: () => 'No more available segments in this module.',
			[NATIVE_LANGUAGE.KAZAKH]: () => 'Бұл модульде басқа сегменттер жоқ.',
			[NATIVE_LANGUAGE.RUSSIAN]: () => 'В этом модуле больше нет доступных сегментов.',
		},
		NO_INTEREST_SEGMENT_FOUND: {
			[NATIVE_LANGUAGE.ENGLISH]: (segmentId: number) =>
				`No interest segment found for segment ${segmentId} with selected interest.`,
			[NATIVE_LANGUAGE.KAZAKH]: (segmentId: number) =>
				`Таңдалған қызығушылық бойынша ${segmentId} сегменті үшін қызығушылық сегменті табылмады.`,
			[NATIVE_LANGUAGE.RUSSIAN]: (segmentId: number) =>
				`Сегмент ${segmentId} не найден сегмент интереса с выбранным интересом.`,
		},
		NO_CURRENT_INTEREST_SEGMENT: {
			[NATIVE_LANGUAGE.ENGLISH]: () =>
				'No current interest segment found. Please get the next segment first.',
			[NATIVE_LANGUAGE.KAZAKH]: () =>
				'Ағымдағы қызығушылық сегменті табылмады. Алдымен келесі сегментті алыңыз.',
			[NATIVE_LANGUAGE.RUSSIAN]: () =>
				'Текущий сегмент интереса не найден. Пожалуйста, получите следующий сегмент сначала.',
		},
		NO_EXERCISES_FOUND: {
			[NATIVE_LANGUAGE.ENGLISH]: (interestSegmentId: number) =>
				`No exercises found for interest segment ${interestSegmentId}.`,
			[NATIVE_LANGUAGE.KAZAKH]: (interestSegmentId: number) =>
				`Қызығушылық сегменті ${interestSegmentId} үшін жаттығулар табылмады.`,
			[NATIVE_LANGUAGE.RUSSIAN]: (interestSegmentId: number) =>
				`Упражнения для сегмента интереса ${interestSegmentId} не найдены.`,
		},
		ALL_EXERCISES_COMPLETED: {
			[NATIVE_LANGUAGE.ENGLISH]: () =>
				'All exercises for this segment have been completed. Please get the next segment.',
			[NATIVE_LANGUAGE.KAZAKH]: () =>
				'Бұл сегменттегі барлық жаттығулар аяқталды. Келесі сегментті алыңыз.',
			[NATIVE_LANGUAGE.RUSSIAN]: () =>
				'Все упражнения для этого сегмента завершены. Пожалуйста, получите следующий сегмент.',
		},
		EXERCISE_COMPLETED: {
			[NATIVE_LANGUAGE.ENGLISH]: (score: number) => `Exercise completed! Score: ${score}%`,
			[NATIVE_LANGUAGE.KAZAKH]: (score: number) => `Жаттығу аяқталды! Ұпай: ${score}%`,
			[NATIVE_LANGUAGE.RUSSIAN]: (score: number) => `Упражнение завершено! Балл: ${score}%`,
		},
	}

	constructor(
		private readonly sessionService: ChatSessionService,
		private readonly messageService: ChatMessageService,
		private readonly contentService: ContentService,
		private readonly vocabularyService: VocabularyService, // Assuming this service exists for vocabulary handling
		private readonly exerciseValidationService: ExerciseValidationFacadeService,
		private readonly feedbackService: FeedbackService,
		private readonly learnerProgressService: LearnerProgressService,
		private readonly prisma: PrismaService,
		private readonly stateMachine: ChatFlowStateService,
		private readonly asrService: PronunciationASRService,
		private readonly s3: S3Service,
		@InjectModel(ExerciseAttempt.name)
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
	) {}

	private _getLocalizedMessage(
		key: keyof typeof this.MESSAGES,
		language: NATIVE_LANGUAGE,
		...args: (string | number)[]
	): string {
		const messageTemplate = this.MESSAGES[key][language]
		if (typeof messageTemplate === 'function') {
			return (messageTemplate as (...args: any[]) => string)(...args)
		}
		return messageTemplate // Should not happen if all templates are functions
	}

	/**
	 * Helper to build ChatFlowContext and fetch learner preferences, centralizing common logic.
	 * Also handles module-level interest rotation.
	 */
	private async _buildChatFlowContextAndPreferences(
		learnerId: number,
		moduleId: number,
		session: ChatSessionDocument,
	): Promise<ChatFlowContext> {
		const preferences = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true, interests: true },
		})

		const learnerPreferences = {
			language: preferences?.nativeLanguage || NATIVE_LANGUAGE.ENGLISH,
			interests: preferences?.interests || [],
		}

		// Handle module-level interest rotation
		let currentInterestIndex = session.learningContext.interestIndex ?? 0
		let selectedInterest: INTEREST | undefined

		if (learnerPreferences.interests.length > 0) {
			if (currentInterestIndex >= learnerPreferences.interests.length) {
				currentInterestIndex = 0 // Reset if index is out of bounds
			}
			selectedInterest = learnerPreferences.interests[currentInterestIndex]
		}

		// Update session with new interest index and selected interest
		if (
			session.learningContext.interestIndex !== currentInterestIndex ||
			session.learningContext.selectedInterest !== selectedInterest
		) {
			session.learningContext.interestIndex = currentInterestIndex
			session.learningContext.selectedInterest = selectedInterest
			await this.sessionService.updateSession(session.sessionId, {
				learningContext: session.learningContext,
			})
		}

		return {
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			flowState: session.state,
			progress: session.learningContext,
			preferences: learnerPreferences,
			activeContent: {
				segmentId: session.learningContext.currentSegmentId,
				interestSegmentId: session.learningContext.currentInterestSegmentId,
				exerciseId: session.learningContext.currentExerciseId,
				// content will be populated by specific methods
			},
		}
	}

	/**
	 * Helper to build ChatResponseDto, centralizing common response structure.
	 */
	private _buildChatResponse(
		message: unknown, // ChatMessage type is not directly imported, so keeping any for now
		session: ChatSessionDocument,
		context: ChatFlowContext,
	): ChatResponseDto {
		const allowedActions = this.stateMachine.getAllowedActions(session.state, context)
		return {
			message: this.messageService.mapMessageToDto(message as ChatMessageDocument),
			session: this.sessionService.mapSessionToDto(session),
			allowedActions,
			context: {
				scope: context.activeContent?.segmentId ? ChatContextScope.CURRENT_SEGMENT : null,
				hasRAGContext: false,
				responseTime: 0,
				tokensUsed: 0,
			},
		}
	}

	async beginModule(learnerId: number, moduleId: number): Promise<ChatResponseDto> {
		this.logger.debug(`Beginning module ${moduleId} for learner ${learnerId}`)

		let session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}
		// session is guaranteed to be non-null after this point

		// Initialize learning context if it's a new session or first time entering module
		if (!session.learningContext.segmentIds || session.learningContext.segmentIds.length === 0) {
			const segmentIds = await this.contentService.getSegmentIdsForModule(moduleId)

			if (segmentIds.length === 0) {
				// Graceful handling for no segments
				const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)
				const message = await this.messageService.createMessage({
					sessionId: session.sessionId,
					learnerId,
					moduleId,
					type: ChatMessageType.SYSTEM_MODULE_INFO,
					content: this._getLocalizedMessage(
						'NO_SEGMENTS_FOUND',
						context.preferences.language,
						moduleId,
					),
				})
				return this._buildChatResponse(message, session, context)
			}

			session.learningContext.segmentIds = segmentIds
			session.learningContext.currentSegmentIndex = 0
			session.learningContext.completedSegmentIds =
				session.learningContext.completedSegmentIds || []
			session.learningContext.completedExerciseIds =
				session.learningContext.completedExerciseIds || []
			// Initialize interest index for this module if not already set
			if (session.learningContext.interestIndex === undefined) {
				session.learningContext.interestIndex = 0
			}
		}

		session = await this.sessionService.updateSession(session.sessionId, {
			learningContext: session.learningContext,
			state: ChatFlowState.MODULE_WELCOME,
		})

		const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)

		const module = await this.contentService.getModuleById(moduleId)
		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			type: ChatMessageType.SYSTEM_MODULE_INFO,
			content: this._getLocalizedMessage(
				'MODULE_WELCOME',
				context.preferences.language,
				module.title,
				session.learningContext.segmentIds.length,
			),
		})

		return this._buildChatResponse(message, session, context)
	}

	async getNextSegment(learnerId: number, moduleId: number): Promise<ChatResponseDto> {
		this.logger.debug(`Getting next segment for learner ${learnerId}, module ${moduleId}`)

		let session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}
		// session is guaranteed to be non-null after this point

		const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)

		if (!this.stateMachine.canTransition(session.state, ChatActionType.NEXT_SEGMENT, context)) {
			throw new BadRequestException('Cannot get next segment in the current state')
		}

		// Check if we have more segments
		const totalSegments = session.learningContext.segmentIds.length
		let currentIndex = session.learningContext.currentSegmentIndex

		this.logger.debug(`Current segment index: ${currentIndex}, Total segments: ${totalSegments}`)

		if (currentIndex >= totalSegments) {
			// All segments in this module have been completed
			session.state = ChatFlowState.MODULE_COMPLETE // Transition to module complete state
			await this.sessionService.updateSession(session.sessionId, { state: session.state })
			const baseContent = this._getLocalizedMessage('MODULE_COMPLETE', context.preferences.language)
			const interventionSummary = await this.getModuleCompletionInterventionPrompt(
				learnerId,
				moduleId,
				context.preferences.language,
			)
			const combinedContent = `${baseContent}\n\n${interventionSummary}`
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: combinedContent,
			})

			await this.vocabularyService.appendModuleVocabulary(
				moduleId,
				learnerId,
				context.preferences.language,
			)
			return this._buildChatResponse(message, session, context)
		}

		let segmentId = session.learningContext.segmentIds[currentIndex]
		let segment: SegmentDetailDto | null = null
		let attempts = 0
		const MAX_ATTEMPTS = totalSegments // Prevent infinite loops if many segments are missing

		// Loop to find the next available segment, skipping missing ones
		while (!segment && currentIndex < totalSegments && attempts < MAX_ATTEMPTS) {
			segmentId = session.learningContext.segmentIds[currentIndex]
			if (segmentId) {
				try {
					segment = await this.contentService.getSegmentDetailForLearner(
						segmentId,
						context.preferences.language,
					)
				} catch (error: any) {
					this.logger.warn(
						`Segment ${segmentId} not found or error fetching: ${error instanceof Error ? error.message : error}. Skipping.`,
					)
					segment = null // Ensure segment is null if an error occurred
				}
			}

			if (!segment) {
				currentIndex++ // Try next segment
				session.learningContext.currentSegmentIndex = currentIndex // Update index in session
				await this.sessionService.updateSession(session.sessionId, {
					learningContext: session.learningContext,
				})
			}
			attempts++
		}

		if (!segment) {
			// No valid segments found after skipping
			session.state = ChatFlowState.MODULE_COMPLETE // Consider module complete if no more content
			await this.sessionService.updateSession(session.sessionId, { state: session.state })
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: this._getLocalizedMessage('NO_MORE_SEGMENTS', context.preferences.language),
			})
			return this._buildChatResponse(message, session, context)
		}

		this.logger.debug(`Loading segment ${segmentId} at index ${currentIndex}`)

		// Update session with current segment info
		session.learningContext.currentSegmentId = segmentId
		session.learningContext.currentSegmentIndex = currentIndex // Ensure index is updated;

		// Get interest segments for this segment based on the module's selected interest
		const interestSegments = await this.contentService.getInterestSegmentsForLearner(
			segmentId,
			context.preferences.language,
		)

		// Select interest segment based on the module's selected interest
		const selectedInterestSegment =
			interestSegments.find(
				(is: { id: number; interest: INTEREST }) =>
					is.interest === session!.learningContext.selectedInterest,
			) || interestSegments[0] // Fallback to first if no match

		if (selectedInterestSegment) {
			session.learningContext.currentInterestSegmentId = selectedInterestSegment.id
		} else {
			// Handle case where no interest segment is found for the selected interest or any interest
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: this._getLocalizedMessage(
					'NO_INTEREST_SEGMENT_FOUND',
					context.preferences.language,
					segmentId,
				),
			})
			return this._buildChatResponse(message, session, context)
		}

		const newState = this.stateMachine.transition(
			session.state,
			ChatActionType.NEXT_SEGMENT,
			context,
		)

		session = await this.sessionService.updateSession(session.sessionId, {
			state: newState,
			learningContext: session.learningContext,
		})

		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			type: ChatMessageType.SYSTEM_SEGMENT_CONTENT,
			content: segment.theoryContent,
			contentReference: { id: segment.id, type: MessageReferenceType.SEGMENT },
		})

		return this._buildChatResponse(message, session, context)
	}

	async getNextExercise(learnerId: number, moduleId: number): Promise<ChatResponseDto> {
		this.logger.debug(`Getting next exercise for learner ${learnerId}, module ${moduleId}`)

		let session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}
		// session is guaranteed to be non-null after this point

		const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)

		if (!session.learningContext.currentInterestSegmentId) {
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: 'No current interest segment found. Please get the next segment first.',
			})
			return this._buildChatResponse(message, session, context)
		}

		if (!this.stateMachine.canTransition(session.state, ChatActionType.START_EXERCISE, context)) {
			throw new BadRequestException('Cannot get next exercise in the current state')
		}

		const allExercises = await this.contentService.getExercisesForLearner(
			session.learningContext.currentInterestSegmentId,
			context.preferences.language,
		)

		if (allExercises.length === 0) {
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: this._getLocalizedMessage(
					'NO_EXERCISES_FOUND',
					context.preferences.language,
					session.learningContext.currentInterestSegmentId,
				),
			})
			return this._buildChatResponse(message, session, context)
		}

		// Filter out already completed exercises for the current segment
		const availableExercises = allExercises.filter(
			ex => !session!.learningContext.completedExerciseIds.includes(ex.id),
		)

		let exercise: ExerciseDto | null = null
		if (availableExercises.length > 0) {
			// Select a random exercise from available ones
			const randomIndex = Math.floor(Math.random() * availableExercises.length)
			exercise = availableExercises[randomIndex]
		} else {
			// All exercises in current segment completed, or no new exercises available
			const message = await this.messageService.createMessage({
				sessionId: session.sessionId,
				learnerId,
				moduleId,
				type: ChatMessageType.SYSTEM_MODULE_INFO,
				content: this._getLocalizedMessage('ALL_EXERCISES_COMPLETED', context.preferences.language),
			})
			return this._buildChatResponse(message, session, context)
		}

		session.learningContext.currentExerciseId = exercise.id

		const newState = this.stateMachine.transition(
			session.state,
			ChatActionType.START_EXERCISE,
			context,
		)

		session = await this.sessionService.updateSession(session.sessionId, {
			state: newState,
			learningContext: session.learningContext,
		})

		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			type: ChatMessageType.SYSTEM_EXERCISE_PROMPT,
			content: JSON.stringify(exercise), // Include full exercise payload
			exerciseReference: {
				exerciseId: exercise.id,
				exerciseType: exercise.type,
				interestSegmentId: session.learningContext.currentInterestSegmentId,
			},
		})

		return this._buildChatResponse(message, session, context)
	}

	async submitExerciseAnswer(
		learnerId: number,
		moduleId: number,
		dto: SubmitExerciseAnswerDto,
	): Promise<ChatResponseDto> {
		this.logger.debug(
			`Submitting exercise answer for learner ${learnerId}, exercise ${dto.exerciseId}`,
		)

		let session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}
		// session is guaranteed to be non-null after this point

		const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)

		if (!this.stateMachine.canTransition(session.state, ChatActionType.SUBMIT_ANSWER, context)) {
			throw new BadRequestException('Cannot submit answer in the current state')
		}

		// Implement exercise validation
		const descriptor = await this.exerciseValidationService.validate(
			'chat',
			dto.exerciseId,
			dto.answer as ExerciseAnswer,
			dto.isDontKnow ?? false,
			context.preferences.language,
			{ learnerId, moduleId, segmentId: session.learningContext.currentSegmentId },
		)
		const validationResult = descriptor.result
		const isCorrect = validationResult.isCorrect
		const score = validationResult.score

		// Save exercise attempt
		const exercise = await this.contentService.getExerciseById(dto.exerciseId)
		const attempt = await this.learnerProgressService.saveExerciseAttempt({
			learnerId,
			exerciseId: dto.exerciseId,
			answer: dto.answer,
			isCorrect,
			score,
			timeSpent: 0, // This will need to be calculated
		})
		const feedback = await this.feedbackService.generateFeedback(
			attempt,
			exercise,
			context.preferences.language,
			learnerId,
			moduleId,
		)

		// Mark exercise as completed
		if (!session.learningContext.completedExerciseIds.includes(dto.exerciseId)) {
			session.learningContext.completedExerciseIds.push(dto.exerciseId)
		}

		// Check if we should move to next segment
		if (!session.learningContext.currentInterestSegmentId) {
			throw new BadRequestException('No current interest segment found')
		}

		const allExercises = await this.contentService.getExercisesForLearner(
			session.learningContext.currentInterestSegmentId,
			context.preferences.language,
		)

		const completedExercisesInSegment = allExercises.filter(ex =>
			session!.learningContext.completedExerciseIds.includes(ex.id),
		)

		const shouldMoveToNextSegment =
			completedExercisesInSegment.length >= EXERCISES_PER_SEGMENT ||
			completedExercisesInSegment.length === allExercises.length

		if (shouldMoveToNextSegment) {
			if (session.learningContext.currentSegmentId) {
				session.learningContext.completedSegmentIds.push(session.learningContext.currentSegmentId)
			}
			session.learningContext.currentSegmentIndex++
			session.learningContext.currentSegmentId = undefined
			session.learningContext.currentInterestSegmentId = undefined
			session.learningContext.currentExerciseId = undefined

			// Increment interest index for the next module if applicable
			if (context.preferences.interests.length > 0) {
				session.learningContext.interestIndex =
					((session.learningContext.interestIndex ?? 0) + 1) % context.preferences.interests.length
			}
		} else {
			session.learningContext.currentExerciseId = undefined
		}

		const newState = this.stateMachine.transition(
			session.state,
			ChatActionType.SUBMIT_ANSWER,
			context,
		)

		session = await this.sessionService.updateSession(session.sessionId, {
			state: newState,
			learningContext: session.learningContext,
		})

		// Segment-level intervention removed; handled at module completion now

		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			type: ChatMessageType.USER_EXERCISE_ANSWER,
			content: feedback,
			userAnswer: {
				exerciseId: dto.exerciseId,
				answer: dto.answer ? dto.answer : null,
				isCorrect,
				score,
				submittedAt: new Date(),
			},
		})

		return this._buildChatResponse(message, session, context)
	}

	/**
	 * Handle pronunciation audio submission inside chat flow.
	 */
	async submitPronunciationAnswer(
		learnerId: number,
		moduleId: number,
		file: Express.Multer.File,
		body: BaseSubmitDto,
	): Promise<ChatResponseDto> {
		this.logger.debug(
			`Pronunciation submission for learner ${learnerId}, exercise ${body.exerciseId}`,
		)

		let session = await this.sessionService.getSessionByModuleId(learnerId, moduleId)
		if (!session) throw new BadRequestException('No active session found for this learner')

		const context = await this._buildChatFlowContextAndPreferences(learnerId, moduleId, session)

		// Short-circuit when learner explicitly doesn't know
		if (body.isDontKnow) {
			// Create an incorrect attempt with score 0 and no ASR/LLM processing
			const attempt = await this.learnerProgressService.saveExerciseAttempt({
				learnerId,
				exerciseId: body.exerciseId,
				answer: null,
				isCorrect: false,
				score: 0,
				timeSpent: 0,
			})

			// Start background upload now that we have the DB-assigned attempt number
			const ext =
				(file.mimetype && file.mimetype.split('/')[1]) ||
				(file.originalname && file.originalname.split('.').pop()) ||
				'ogg'
			const attemptMarker = attempt.attemptNumber ?? Date.now()
			const filename = `pronunciation/${learnerId}/${body.exerciseId}/${attemptMarker}.${ext}`
			const uploadPromise = this._startBackgroundUpload(filename, file.buffer, file.mimetype)

			// patch audioKey when upload finishes
			void this._patchAttemptAudioKeyWhenReady(attempt._id, uploadPromise)

			const feedback = `Marked as "I don't know". Score: 0%.`

			const message = await this._createUserExerciseMessage(
				session,
				learnerId,
				moduleId,
				feedback,
				{
					exerciseId: body.exerciseId,
					answer: null,
					isCorrect: false,
					score: 0,
					submittedAt: new Date(),
				},
			)

			// Update session and return
			session.learningContext.completedExerciseIds.push(body.exerciseId)
			session = await this.sessionService.updateSession(session.sessionId, {
				learningContext: session.learningContext,
			})

			return this._buildChatResponse(message, session, context)
		}

		// Normal flow: ASR -> validation -> persist attempt -> feedback
		const lang = String(context.preferences.language)
		const asr: AsrResult = await this.asrService.transcribeBuffer(file.buffer, lang)
		const answer: ExerciseAnswer = { transcript: asr.transcript, confidence: asr.confidence }

		const descriptor = await this.exerciseValidationService.validate(
			'chat',
			body.exerciseId,
			answer,
			false,
			context.preferences.language,
			{ learnerId, moduleId, segmentId: session.learningContext.currentSegmentId },
		)

		const validationResult = descriptor.result
		const exercise = await this.contentService.getExerciseById(body.exerciseId)

		// Persist attempt after validation
		const attempt = await this.learnerProgressService.saveExerciseAttempt({
			learnerId,
			exerciseId: body.exerciseId,
			answer,
			isCorrect: validationResult.isCorrect,
			score: validationResult.score,
			timeSpent: 0,
		})

		// Start background upload now that we have the DB-assigned attempt number
		const ext =
			(file.mimetype && file.mimetype.split('/')[1]) ||
			(file.originalname && file.originalname.split('.').pop()) ||
			'ogg'
		const attemptMarker = attempt.attemptNumber ?? Date.now()
		const filename = `pronunciation/${learnerId}/${body.exerciseId}/${attemptMarker}.${ext}`
		const uploadPromise = this._startBackgroundUpload(filename, file.buffer, file.mimetype)

		// Save ASR result (best-effort)
		void this._saveAsrResultToAttempt(attempt._id, asr)

		// When upload completes, patch the attempt with audioKey (async)
		void this._patchAttemptAudioKeyWhenReady(attempt._id, uploadPromise)

		const feedback = await this.feedbackService.generateFeedback(
			attempt,
			exercise,
			context.preferences.language,
			learnerId,
			moduleId,
		)

		const message = await this._createUserExerciseMessage(session, learnerId, moduleId, feedback, {
			exerciseId: body.exerciseId,
			answer,
			isCorrect: validationResult.isCorrect,
			score: validationResult.score,
			feedback: validationResult.feedback,
			submittedAt: new Date(),
		})

		// Update session and return response
		session.learningContext.completedExerciseIds.push(body.exerciseId)
		session = await this.sessionService.updateSession(session.sessionId, {
			learningContext: session.learningContext,
		})

		return this._buildChatResponse(message, session, context)
	}

	/**
	 * Start background upload and return promise that resolves to audioKey or undefined
	 */
	private _startBackgroundUpload(
		filename: string,
		buffer: Buffer,
		mimetype?: string,
	): Promise<string | undefined> {
		return this.s3.uploadAudio(filename, buffer, mimetype || 'audio/ogg').catch(err => {
			this.logger.error('S3 upload failed', err)
			return undefined
		})
	}

	private async _patchAttemptAudioKeyWhenReady(
		attemptId: string,
		uploadPromise: Promise<string | undefined>,
	) {
		try {
			const key = await uploadPromise
			if (!key) return
			await this.attemptModel.findByIdAndUpdate(attemptId, { $set: { audioKey: key } })
			this.logger.debug(`Patched attempt ${attemptId} with audioKey ${key}`)
		} catch (e) {
			this.logger.error('Failed to patch attempt with audioKey', e)
		}
	}

	private async _saveAsrResultToAttempt(attemptId: string, asr: AsrResult) {
		try {
			await this.attemptModel.findByIdAndUpdate(attemptId, { $set: { asrResult: asr } })
		} catch (e) {
			this.logger.error('Failed to save ASR result to attempt', e)
		}
	}

	private async _createUserExerciseMessage(
		session: ChatSessionDocument,
		learnerId: number,
		moduleId: number,
		content: string,
		userAnswer: UserAnswer,
	) {
		return this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId,
			moduleId,
			type: ChatMessageType.USER_EXERCISE_ANSWER,
			content,
			userAnswer,
		})
	}

	// New module-level intervention summary
	private async getModuleCompletionInterventionPrompt(
		learnerId: number,
		moduleId: number,
		language: NATIVE_LANGUAGE,
	): Promise<string> {
		// Gather all segments from session context / DB
		const segmentIds = await this.contentService.getSegmentIdsForModule(moduleId)
		if (!segmentIds.length)
			return this._buildLocalizedModuleReviewPrompt(language, this._noExercisesText(language))
		// Collect all exercises for segments
		const exercisesPerSegment = await Promise.all(
			segmentIds.map(id => this.contentService.getExercisesForSegment(id)),
		)
		const allExercises = exercisesPerSegment.flat()
		if (!allExercises.length)
			return this._buildLocalizedModuleReviewPrompt(language, this._noExercisesText(language))
		const exerciseIds = allExercises.map(e => e.id)
		const attempts = await this.learnerProgressService.getExerciseAttempts(learnerId, exerciseIds)
		if (!attempts.length)
			return this._buildLocalizedModuleReviewPrompt(language, this._noAttemptsText(language))
		// Latest attempt per exercise (attempts sorted desc by createdAt in service)
		const latestByExercise = new Map<number, (typeof attempts)[number]>()
		for (const attempt of attempts) {
			if (!latestByExercise.has(attempt.exerciseId)) {
				latestByExercise.set(attempt.exerciseId, attempt)
			}
		}
		// Determine mistakes (latest attempt score below threshold; includes "I don't know" which yields low score)
		const mistakes = allExercises
			.map(ex => ({ ex, attempt: latestByExercise.get(ex.id) }))
			.filter(x => x.attempt && x.attempt.score < MIN_PASSING_SCORE)
		if (!mistakes.length) {
			return this._buildLocalizedModuleReviewPrompt(language, this._noMistakesText(language))
		}
		const listed = mistakes.slice(0, MAX_INTERVENTION_MISTAKES)
		const extra = mistakes.length - listed.length
		const bulletLines = listed.map(m => {
			// ExerciseDto has 'title' field; ensure presence with fallback
			const ex: { id: number; title?: string } = m.ex as { id: number; title?: string }
			const title = ex.title ?? `Exercise ${ex.id}`
			return `• ${title} (id ${ex.id}) – score ${m.attempt!.score}%`
		})
		if (extra > 0) bulletLines.push(`… ${extra} more below ${MIN_PASSING_SCORE}%.`)
		return this._buildLocalizedModuleReviewPrompt(language, bulletLines.join('\n'))
	}

	private _buildLocalizedModuleReviewPrompt(language: NATIVE_LANGUAGE, summary: string): string {
		switch (language) {
			case NATIVE_LANGUAGE.KAZAKH:
				return `Модуль аяқталды. Қателеріңіз:\n${summary}\nОларды ЖИ репетитормен қарап шығуға дайынсыз ба?`
			case NATIVE_LANGUAGE.RUSSIAN:
				return `Модуль завершён. Ваши ошибки:\n${summary}\nХотите разобрать их с ИИ репетитором?`
			case NATIVE_LANGUAGE.ENGLISH:
			default:
				return `Module completed. Your mistakes:\n${summary}\nWant to review them with an AI tutor?`
		}
	}

	private _noExercisesText(language: NATIVE_LANGUAGE): string {
		switch (language) {
			case NATIVE_LANGUAGE.KAZAKH:
				return 'Модульде жаттығулар жоқ.'
			case NATIVE_LANGUAGE.RUSSIAN:
				return 'В модуле нет упражнений.'
			case NATIVE_LANGUAGE.ENGLISH:
			default:
				return 'No exercises in module.'
		}
	}

	private _noAttemptsText(language: NATIVE_LANGUAGE): string {
		switch (language) {
			case NATIVE_LANGUAGE.KAZAKH:
				return 'Әлі бірде-бір жаттығу орындалмады.'
			case NATIVE_LANGUAGE.RUSSIAN:
				return 'Пока ни одно упражнение не выполнено.'
			case NATIVE_LANGUAGE.ENGLISH:
			default:
				return 'No exercises attempted yet.'
		}
	}

	private _noMistakesText(language: NATIVE_LANGUAGE): string {
		switch (language) {
			case NATIVE_LANGUAGE.KAZAKH:
				return 'Елеулі қателер жоқ — өте жақсы жұмыс!'
			case NATIVE_LANGUAGE.RUSSIAN:
				return 'Существенных ошибок нет — отличная работа!'
			case NATIVE_LANGUAGE.ENGLISH:
			default:
				return 'No notable mistakes — great job!'
		}
	}
}
