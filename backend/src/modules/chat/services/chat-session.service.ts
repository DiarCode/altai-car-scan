// src/modules/chat/services/chat-session.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, UpdateQuery } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { ChatSession, ChatSessionDocument } from '../schemas/chat-session.schema'
import { ChatSessionStatus, ChatSessionType, ChatFlowState } from '../types/chat-flow.types'
import { ChatSessionDto, UpdateSessionDto } from '../dtos/chat.dtos'
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema'
import { LearningContext, SessionStats } from '../types/chat.types'
import { NotificationsApi } from 'src/modules/notifications/notifications.service'
import { BaseModuleDto } from 'src/modules/modules/dtos/modules.dtos'

interface SessionAnalyticsData {
	totalSessions?: number
	activeSessions?: number
	completedSessions?: number
	totalMessages?: number
	totalQuestionsAsked?: number
	totalDuration?: number
}

@Injectable()
export class ChatSessionService {
	private readonly logger = new Logger(ChatSessionService.name)

	constructor(
		@InjectModel(ChatSession.name) private readonly chatSessionModel: Model<ChatSessionDocument>,
		@InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
		private readonly notifications?: NotificationsApi,
	) {}

	/**
	 * Create a new chat session
	 */
	async createSession(
		learnerId: number,
		moduleId: number,
		moduleData: BaseModuleDto,
		sessionType: ChatSessionType,
		nextModuleId?: number,
	): Promise<ChatSessionDocument> {
		try {
			const sessionId = uuidv4()

			const session = new this.chatSessionModel({
				sessionId,
				learnerId,
				type: sessionType,
				status: ChatSessionStatus.ACTIVE,
				state: ChatFlowState.MODULE_WELCOME,
				learningContext: {
					moduleId: moduleId,
					module: moduleData, // Store BaseModuleDto here
					segmentIds: [],
					currentSegmentId: undefined, // These should be initialized by chat-flow.service
					currentInterestSegmentId: undefined,
					currentExerciseId: undefined,
					currentSegmentIndex: 0,
					exercisesCompleted: 0,
					exercisesPerSegment: 0,
					completedSegmentIds: [],
					completedExerciseIds: [],
					lastActivityAt: new Date(),
					nextModuleId: nextModuleId,
				},
				stats: new SessionStats(),
				preferences: undefined, // Preferences should be set by the learner's profile or later
				startedAt: new Date(),
			})

			await session.save()
			this.logger.debug(`Session created: ${sessionId}`)
			return session
		} catch (error) {
			this.logger.error('Error creating session:', error)
			throw error
		}
	}

	/**
	 * Get session by ID
	 */
	async getSessionById(sessionId: string): Promise<ChatSessionDocument> {
		const session = await this.chatSessionModel.findOne({ sessionId }).exec()
		if (!session) {
			throw new NotFoundException(`Session ${sessionId} not found`)
		}
		return session
	}

	/**
	 * Get active session for learner in module
	 */
	async getActiveSession(learnerId: number, moduleId: number): Promise<ChatSessionDocument | null> {
		return this.chatSessionModel
			.findOne({
				learnerId,
				'learningContext.moduleId': moduleId,
				status: ChatSessionStatus.ACTIVE,
			})
			.exec()
	}

	async findSessionsByModuleIdsAndState(
		learnerId: number,
		moduleIds: number[],
		state: ChatFlowState,
	): Promise<ChatSessionDocument[]> {
		return this.chatSessionModel
			.find({
				learnerId,
				'learningContext.moduleId': { $in: moduleIds },
				state,
			})
			.exec()
	}

	/**
	 * Get or create active session
	 */
	async getOrCreateActiveSession(
		learnerId: number,
		moduleId: number,
		moduleData: BaseModuleDto,
		sessionType: ChatSessionType = ChatSessionType.LEARNING_FLOW,
		nextModuleId?: number,
	): Promise<ChatSessionDocument & { messages: ChatMessageDocument[] }> {
		let session = await this.getSessionByModuleId(learnerId, moduleId)

		if (!session) {
			session = await this.createSession(learnerId, moduleId, moduleData, sessionType, nextModuleId)
		} else {
			if (
				session.learningContext.module.id !== moduleData.id ||
				session.learningContext.module.title !== moduleData.title
			) {
				session = await this.updateLearningContext(session.sessionId, {
					module: moduleData,
					nextModuleId: nextModuleId,
				})
			} else if (session.learningContext.nextModuleId !== nextModuleId) {
				session = await this.updateLearningContext(session.sessionId, {
					nextModuleId: nextModuleId,
				})
			}
		}

		const messages = await this.chatMessageModel.find({ sessionId: session.sessionId }).exec()

		return { ...session.toObject(), messages } as ChatSessionDocument & {
			messages: ChatMessageDocument[]
		}
	}

	async getActiveSessionForLearner(learnerId: number): Promise<ChatSessionDocument | null> {
		return this.chatSessionModel
			.findOne({
				learnerId,
				status: ChatSessionStatus.ACTIVE,
			})
			.exec()
	}

	async getSessionByModuleId(
		learnerId: number,
		moduleId: number,
	): Promise<ChatSessionDocument | null> {
		return this.chatSessionModel
			.findOne({
				learnerId,
				'learningContext.moduleId': moduleId,
				status: ChatSessionStatus.ACTIVE,
			})
			.exec()
	}

	async getSessionByModuleIdAndState(
		learnerId: number,
		moduleId: number,
		state: ChatFlowState,
	): Promise<ChatSessionDocument | null> {
		return this.chatSessionModel
			.findOne({
				learnerId,
				'learningContext.moduleId': moduleId,
				state: state,
			})
			.exec()
	}

	/**
	 * Update session - FIXED VERSION
	 */
	async updateSession(
		sessionId: string,
		updates: Partial<UpdateSessionDto>,
	): Promise<ChatSessionDocument> {
		this.logger.debug(`Updating session ${sessionId} with:`, updates)

		const updateData: UpdateQuery<ChatSessionDocument> = { ...updates }

		if (updates.status === ChatSessionStatus.COMPLETED) {
			updateData.endedAt = new Date()
		}

		const session = await this.chatSessionModel
			.findOneAndUpdate({ sessionId }, updateData, { new: true })
			.exec()

		if (!session) {
			throw new NotFoundException(`Session ${sessionId} not found after update`)
		}

		this.logger.debug(
			`Session updated successfully. New segmentIds:`,
			session.learningContext.segmentIds.length,
		)
		return session
	}

	/**
	 * Specialized method for updating learning context safely
	 */
	async updateLearningContext(
		sessionId: string,
		contextUpdates: Partial<LearningContext>,
	): Promise<ChatSessionDocument> {
		this.logger.debug(`Updating learning context for session ${sessionId}:`, contextUpdates)

		const session = await this.chatSessionModel.findOne({ sessionId }).exec()
		if (!session) {
			throw new NotFoundException(`Session ${sessionId} not found`)
		}

		// Merge the updates with existing context
		const updatedContext: Partial<LearningContext> = {
			...session.learningContext,
			...contextUpdates,
			lastActivityAt: new Date(),
		}

		const result = await this.chatSessionModel
			.findOneAndUpdate(
				{ sessionId },
				{
					learningContext: updatedContext,
					'stats.lastActivityAt': new Date(),
				},
				{ new: true },
			)
			.exec()

		if (!result) {
			throw new NotFoundException(`Session ${sessionId} not found during update`)
		}

		this.logger.debug(`Learning context updated. New context:`, result.learningContext)
		return result
	}
	/**
	 * Update session statistics
	 */
	async updateSessionStats(
		sessionId: string,
		stats: {
			totalMessages?: number
			userMessages?: number
			aiResponses?: number
			questionsAsked?: number
			exercisesCompleted?: number
			totalScore?: number
			averageResponseTime?: number
		},
	): Promise<ChatSessionDocument> {
		const updateData: UpdateQuery<ChatSessionDocument> = {
			'stats.lastActivityAt': new Date(),
			$inc: {},
		}
		// Increment counters
		if (stats.totalMessages) {
			;(updateData.$inc as Record<string, number>)['stats.totalMessages'] = stats.totalMessages
		}
		if (stats.userMessages) {
			;(updateData.$inc as Record<string, number>)['stats.userMessages'] = stats.userMessages
		}
		if (stats.aiResponses) {
			;(updateData.$inc as Record<string, number>)['stats.aiResponses'] = stats.aiResponses
		}
		if (stats.questionsAsked) {
			;(updateData.$inc as Record<string, number>)['stats.questionsAsked'] = stats.questionsAsked
		}
		if (stats.exercisesCompleted) {
			;(updateData.$inc as Record<string, number>)['stats.exercisesCompleted'] =
				stats.exercisesCompleted
		}
		if (stats.totalScore) {
			;(updateData.$inc as Record<string, number>)['stats.totalScore'] = stats.totalScore
		}

		// Update averages
		if (stats.averageResponseTime) {
			updateData['stats.averageResponseTime'] = stats.averageResponseTime
		}

		const session = await this.chatSessionModel
			.findOneAndUpdate({ sessionId }, updateData, { new: true })
			.exec()

		if (!session) {
			throw new NotFoundException(`Session ${sessionId} not found`)
		}

		return session
	}

	async getLatestRelevantSessionByLearner(learnerId: number): Promise<ChatSessionDocument | null> {
		// Try to find the latest active session
		const activeSession = await this.chatSessionModel
			.findOne({ learnerId, status: ChatSessionStatus.ACTIVE })
			.sort({ updatedAt: -1 }) // Or createdAt, depending on what "latest" means for active
			.exec()

		if (activeSession) {
			return activeSession
		}

		// If no active session, try to find the latest completed session
		const completedSession = await this.chatSessionModel
			.findOne({ learnerId, status: ChatSessionStatus.COMPLETED })
			.sort({ endedAt: -1 }) // Sort by endedAt for completed sessions
			.exec()

		return completedSession
	}

	/**
	 * Pause session
	 */
	async pauseSession(sessionId: string): Promise<ChatSessionDocument> {
		return this.updateSession(sessionId, { status: ChatSessionStatus.PAUSED })
	}

	/**
	 * Resume session
	 */
	async resumeSession(sessionId: string): Promise<ChatSessionDocument> {
		return this.updateSession(sessionId, { status: ChatSessionStatus.ACTIVE })
	}

	/**
	 * Complete session
	 */
	async completeSession(sessionId: string): Promise<ChatSessionDocument> {
		const updated = await this.updateSession(sessionId, { status: ChatSessionStatus.COMPLETED })
		// Fire notification non-blocking
		try {
			await this.notifications?.chatSessionCompleted(updated.learnerId, updated.sessionId)
		} catch (e) {
			this.logger.debug(`chatSessionCompleted notification failed: ${e}`)
		}
		return updated
	}

	/**
	 * Abandon session
	 */
	async abandonSession(sessionId: string): Promise<ChatSessionDocument> {
		return this.updateSession(sessionId, { status: ChatSessionStatus.ABANDONED })
	}

	/**
	 * Delete session
	 */
	async deleteSession(sessionId: string): Promise<void> {
		const result = await this.chatSessionModel.deleteOne({ sessionId }).exec()
		if (result.deletedCount === 0) {
			throw new NotFoundException(`Session ${sessionId} not found`)
		}
	}

	/**
	 * Get session statistics
	 */
	mapSessionToDto(session: ChatSessionDocument): ChatSessionDto {
		const sessionDto = new ChatSessionDto()
		sessionDto.sessionId = session.sessionId
		sessionDto.learnerId = session.learnerId
		sessionDto.type = session.type
		sessionDto.status = session.status
		sessionDto.state = session.state
		sessionDto.learningContext = session.learningContext
		sessionDto.stats = session.stats
		sessionDto.preferences = session.preferences
		sessionDto.lastMessageId = session.lastMessageId
		sessionDto.startedAt = session.startedAt
		sessionDto.endedAt = session.endedAt
		sessionDto.createdAt = session.createdAt
		sessionDto.updatedAt = session.updatedAt
		return sessionDto
	}

	async getSessionAnalytics(
		learnerId: number,
		moduleId?: number,
	): Promise<{
		totalSessions: number
		activeSessions: number
		completedSessions: number
		averageSessionDuration: number
		totalMessages: number
		totalQuestionsAsked: number
	}> {
		const matchFilter = this.buildAnalyticsMatchFilter(learnerId, moduleId)
		const pipeline = this.buildAnalyticsPipeline(matchFilter)

		const results = await this.chatSessionModel.aggregate<SessionAnalyticsData>(pipeline).exec()
		const stats = results[0] ?? {}

		return this.formatAnalyticsResults(stats)
	}

	private buildAnalyticsMatchFilter(learnerId: number, moduleId?: number): Record<string, any> {
		const matchFilter: Record<string, any> = { learnerId }
		if (moduleId) {
			matchFilter['learningContext.moduleId'] = moduleId
		}
		return matchFilter
	}

	private buildAnalyticsPipeline(matchFilter: Record<string, any>): any[] {
		return [
			{ $match: matchFilter },
			{
				$group: {
					_id: null,
					totalSessions: { $sum: 1 },
					activeSessions: {
						$sum: { $cond: [{ $eq: ['$status', ChatSessionStatus.ACTIVE] }, 1, 0] },
					},
					completedSessions: {
						$sum: { $cond: [{ $eq: ['$status', ChatSessionStatus.COMPLETED] }, 1, 0] },
					},
					totalMessages: { $sum: '$stats.totalMessages' },
					totalQuestionsAsked: { $sum: '$stats.questionsAsked' },
					totalDuration: {
						$sum: {
							$cond: [
								{ $ifNull: ['$endedAt', false] },
								{ $subtract: ['$endedAt', '$startedAt'] },
								{ $subtract: [new Date(), '$startedAt'] },
							],
						},
					},
				},
			},
		]
	}

	private formatAnalyticsResults(stats: SessionAnalyticsData): {
		totalSessions: number
		activeSessions: number
		completedSessions: number
		averageSessionDuration: number
		totalMessages: number
		totalQuestionsAsked: number
	} {
		const totalSessions = stats.totalSessions || 0
		const totalDuration = stats.totalDuration || 0
		const averageSessionDuration = totalSessions ? totalDuration / totalSessions : 0

		return {
			totalSessions,
			activeSessions: stats.activeSessions || 0,
			completedSessions: stats.completedSessions || 0,
			averageSessionDuration,
			totalMessages: stats.totalMessages || 0,
			totalQuestionsAsked: stats.totalQuestionsAsked || 0,
		}
	}

	/**
	 * Append a conversation summary (long-term memory chunk) to a session.
	 * Ensures we don't insert an overlapping identical range twice.
	 */
	async appendConversationSummary(
		sessionId: string,
		data: {
			summary: string
			fromMessageCreatedAt: Date
			toMessageCreatedAt: Date
		},
	): Promise<ChatSessionDocument> {
		// Re-fetch to perform a quick overlapping check (defensive; caller also guards)
		const existing = await this.chatSessionModel.findOne({ sessionId }).exec()
		if (!existing) {
			throw new NotFoundException(`Session ${sessionId} not found for summary append`)
		}
		const overlaps = existing.conversationSummaries?.some(
			s =>
				// existing summary fully covers new window OR new window fully covers existing
				(s.fromMessageCreatedAt <= data.fromMessageCreatedAt &&
					s.toMessageCreatedAt >= data.toMessageCreatedAt) ||
				(data.fromMessageCreatedAt <= s.fromMessageCreatedAt &&
					data.toMessageCreatedAt >= s.toMessageCreatedAt),
		)
		if (overlaps) {
			this.logger.debug(
				`Skipping summary append for ${sessionId} due to overlapping range ${data.fromMessageCreatedAt.toISOString()} - ${data.toMessageCreatedAt.toISOString()}`,
			)
			return existing
		}

		const session = await this.chatSessionModel
			.findOneAndUpdate(
				{ sessionId },
				{
					$push: {
						conversationSummaries: {
							$each: [
								{
									summary: data.summary,
									fromMessageCreatedAt: data.fromMessageCreatedAt,
									toMessageCreatedAt: data.toMessageCreatedAt,
									createdAt: new Date(),
								},
							],
							$sort: { toMessageCreatedAt: 1 },
						},
						updatedAt: new Date(),
					},
				},
				{ new: true },
			)
			.exec()

		if (!session) {
			throw new NotFoundException(`Session ${sessionId} not found after summary append`)
		}

		this.logger.debug(
			`Appended conversation summary to session ${sessionId}. Range: ${data.fromMessageCreatedAt.toISOString()} - ${data.toMessageCreatedAt.toISOString()}`,
		)
		return session
	}
}
