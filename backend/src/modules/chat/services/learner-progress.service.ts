// src/modules/chat/services/learner-progress.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PrismaService } from 'src/prisma/prisma.service'
import { LearningProgress, ExerciseAttempt } from '../types/chat-flow.types'

export interface LearnerProgressDocument extends Document, LearningProgress {
	_id: string
	sessionId: string
	learnerId: number
}

export interface ExerciseAttemptDocument extends Document, ExerciseAttempt {
	_id: string
	learnerId: number
	createdAt: Date
}

@Injectable()
export class LearnerProgressService {
	private readonly logger = new Logger(LearnerProgressService.name)

	constructor(
		@InjectModel('LearnerProgress')
		private readonly progressModel: Model<LearnerProgressDocument>,
		@InjectModel('ExerciseAttempt')
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
		private readonly prisma: PrismaService,
	) {}

	/**
	 * Save exercise attempt
	 */
	async saveExerciseAttempt(data: {
		learnerId: number
		exerciseId: number
		answer: any
		isCorrect: boolean
		score: number
		timeSpent: number
	}): Promise<ExerciseAttemptDocument> {
		// Get exercise type
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: data.exerciseId },
			select: { type: true },
		})

		if (!exercise) {
			throw new Error(`Exercise ${data.exerciseId} not found`)
		}

		// Count previous attempts
		const attemptCount = await this.attemptModel
			.countDocuments({
				learnerId: data.learnerId,
				exerciseId: data.exerciseId,
			})
			.exec()

		const attempt = new this.attemptModel({
			...data,
			exerciseType: exercise.type,
			attemptNumber: attemptCount + 1,
			hintsUsed: 0,
			createdAt: new Date(),
		})

		await attempt.save()

		// Update completed exercises in progress
		await this.progressModel
			.findOneAndUpdate(
				{ 'progress.currentExerciseId': data.exerciseId },
				{
					$addToSet: { 'progress.completedExerciseIds': data.exerciseId },
				},
			)
			.exec()

		return attempt
	}

	/**
	 * Get module progress for learner
	 */
	async getModuleProgress(
		learnerId: number,
		moduleId: number,
	): Promise<{
		completedSegments: number
		totalSegments: number
		status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
		lastActivityAt?: Date
	}> {
		// Get all sessions for this module
		const sessions = await this.progressModel
			.find({
				learnerId,
				moduleId,
			})
			.exec()

		if (sessions.length === 0) {
			const segments = await this.prisma.segment.count({
				where: { moduleId },
			})

			return {
				completedSegments: 0,
				totalSegments: segments,
				status: 'NOT_STARTED',
			}
		}

		// Aggregate completed segments across all sessions
		const completedSegmentIds = new Set<number>()
		let lastActivity = new Date(0)

		sessions.forEach(session => {
			session.completedSegmentIds.forEach(id => completedSegmentIds.add(id))
			if (session.lastActivityAt > lastActivity) {
				lastActivity = session.lastActivityAt
			}
		})

		const totalSegments = await this.prisma.segment.count({
			where: { moduleId },
		})

		const completedSegments = completedSegmentIds.size
		let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'IN_PROGRESS'

		if (completedSegments === 0) {
			status = 'NOT_STARTED'
		} else if (completedSegments >= totalSegments) {
			status = 'COMPLETED'
		}

		return {
			completedSegments,
			totalSegments,
			status,
			lastActivityAt: lastActivity,
		}
	}

	/**
	 * Get progress for multiple modules
	 */
	async getModulesProgress(
		learnerId: number,
		moduleIds: number[],
	): Promise<
		Record<
			number,
			{
				completedSegments: number
				status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
				lastActivityAt?: Date
			}
		>
	> {
		const result: Record<number, any> = {}

		await Promise.all(
			moduleIds.map(async moduleId => {
				const progress = await this.getModuleProgress(learnerId, moduleId)
				result[moduleId] = progress
			}),
		)

		return result
	}

	/**
	 * Get exercise attempts for learner
	 */
	async getExerciseAttempts(
		learnerId: number,
		exerciseIds?: number[],
	): Promise<ExerciseAttemptDocument[]> {
		const query: { learnerId: number; exerciseId?: { $in: number[] } } = { learnerId }

		if (exerciseIds && exerciseIds.length > 0) {
			query.exerciseId = { $in: exerciseIds }
		}

		return this.attemptModel.find(query).sort({ createdAt: -1 }).exec()
	}

	/**
	 * Get statistics for learner
	 */
	async getLearnerStatistics(learnerId: number): Promise<{
		totalExercisesAttempted: number
		totalCorrectAnswers: number
		averageScore: number
		totalTimeSpent: number
		exercisesByType: Record<
			string,
			{
				attempted: number
				correct: number
				averageScore: number
			}
		>
	}> {
		const attempts = await this.attemptModel.find({ learnerId }).exec()

		if (attempts.length === 0) {
			return {
				totalExercisesAttempted: 0,
				totalCorrectAnswers: 0,
				averageScore: 0,
				totalTimeSpent: 0,
				exercisesByType: {},
			}
		}

		const stats = {
			totalExercisesAttempted: attempts.length,
			totalCorrectAnswers: attempts.filter(a => a.isCorrect).length,
			averageScore: attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
			totalTimeSpent: attempts.reduce((sum, a) => sum + a.timeSpent, 0),
			exercisesByType: {} as Record<string, any>,
		}

		// Group by exercise type
		const typeGroups = attempts.reduce(
			(groups, attempt) => {
				const type = attempt.exerciseType
				if (!groups[type]) {
					groups[type] = []
				}
				groups[type].push(attempt)
				return groups
			},
			{} as Record<string, ExerciseAttemptDocument[]>,
		)

		// Calculate stats per type
		Object.entries(typeGroups).forEach(([type, typeAttempts]) => {
			stats.exercisesByType[type] = {
				attempted: typeAttempts.length,
				correct: typeAttempts.filter(a => a.isCorrect).length,
				averageScore: typeAttempts.reduce((sum, a) => sum + a.score, 0) / typeAttempts.length,
			}
		})

		return stats
	}
}
