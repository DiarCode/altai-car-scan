import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from 'src/common/s3/s3.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { ExerciseValidationFacadeService } from '../exercise-validation/exercise-validation.facade.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ExerciseAttempt } from '../chat/schemas/exercise-attempt.schema'
import { DailyTask, DailyTaskExercise, Exercise, NATIVE_LANGUAGE } from '@prisma/client'
import { ExerciseAnswer } from '../chat/types/chat-flow.types'
import { SubmitDailyTaskExerciseDto } from './dtos/daily-tasks.dtos'
import { NotificationsApi } from '../notifications/notifications.service'
import { PronunciationASRService, AsrResult } from '../asr/pronunciation-asr.service'

const DAILY_EXERCISE_AMOUNT = 5
const FAILED_EXERCISES_AMOUNT = 2
const PREVIOUS_MODULE_EXERCISES_AMOUNT = 2
const RANDOM_EXERCISES_AMOUNT = 1

@Injectable()
export class DailyTasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly exerciseValidationService: ExerciseValidationFacadeService,
		private readonly asrService: PronunciationASRService,
		private readonly s3: S3Service,
		@InjectModel(ExerciseAttempt.name)
		private readonly exerciseAttemptModel: Model<ExerciseAttempt>,
		private readonly notifications?: NotificationsApi,
	) {}

	private readonly logger = new Logger(DailyTasksService.name)

	async getDailyTask(
		learnerId: number,
	): Promise<DailyTask & { exercises: (DailyTaskExercise & { exercise: Exercise })[] }> {
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const task = await this.prisma.dailyTask.findFirst({
			where: {
				learnerId: learnerId,
				createdAt: {
					gte: today,
					lt: tomorrow,
				},
			},
			include: {
				exercises: {
					include: {
						exercise: true,
					},
				},
			},
		})

		if (task) {
			return task
		}

		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		const yesterdayTask = await this.prisma.dailyTask.findFirst({
			where: {
				learnerId: learnerId,
				createdAt: {
					gte: yesterday,
					lt: today,
				},
			},
			include: {
				exercises: {
					include: {
						exercise: true,
					},
				},
			},
		})

		if (yesterdayTask && !yesterdayTask.completed) {
			return yesterdayTask
		}

		return this.createDailyTask(learnerId)
	}

	async createDailyTask(
		learnerId: number,
	): Promise<DailyTask & { exercises: (DailyTaskExercise & { exercise: Exercise })[] }> {
		const exercises = await this.selectExercises(learnerId)
		const task = await this.prisma.dailyTask.create({
			data: {
				learnerId,
				exercises: {
					create: exercises.map(exercise => ({
						exerciseId: exercise.id,
					})),
				},
			},
			include: {
				exercises: {
					include: {
						exercise: true,
					},
				},
			},
		})
		// Fire notification (persist + push)
		try {
			await this.notifications?.dailyTaskCreated(learnerId, { dailyTaskId: task.id })
		} catch (e) {
			console.debug('dailyTaskCreated notification failed', e)
		}
		return task
	}

	private async selectExercises(learnerId: number): Promise<Exercise[]> {
		const failedExercises = await this.getMostFailedExercises(learnerId)
		const previousModuleExercises = await this.getPreviousModuleExercises(learnerId)
		const randomExercises = await this.getRandomExercises()

		const exercises = [...failedExercises, ...previousModuleExercises, ...randomExercises]
		return exercises.slice(0, DAILY_EXERCISE_AMOUNT)
	}

	private async getMostFailedExercises(learnerId: number): Promise<Exercise[]> {
		const attempts = await this.exerciseAttemptModel
			.aggregate([
				{ $match: { learnerId, isCorrect: false } },
				{ $group: { _id: '$exerciseId', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: FAILED_EXERCISES_AMOUNT },
			])
			.exec()

		const exerciseIds = attempts.map((attempt: { _id: number }) => attempt._id)
		return this.prisma.exercise.findMany({ where: { id: { in: exerciseIds } } })
	}

	private async getPreviousModuleExercises(learnerId: number) {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			include: { assignedLevel: { include: { modules: true } } },
		})
		if (!learner) {
			return []
		}
		const lastModule = learner.assignedLevel.modules.sort((a, b) => a.order - b.order).pop()
		if (!lastModule) {
			return []
		}
		return this.prisma.exercise.findMany({
			where: { interestSegment: { segment: { moduleId: lastModule.id } } },
			take: PREVIOUS_MODULE_EXERCISES_AMOUNT,
		})
	}

	private async getRandomExercises(): Promise<Exercise[]> {
		const count = await this.prisma.exercise.count()
		const skip = Math.floor(Math.random() * count)
		return this.prisma.exercise.findMany({
			take: RANDOM_EXERCISES_AMOUNT,
			skip: skip,
		})
	}

	async getDailyTaskExercises(
		dailyTaskId: number,
	): Promise<(DailyTaskExercise & { exercise: Exercise })[]> {
		return this.prisma.dailyTaskExercise.findMany({
			where: { dailyTaskId },
			include: { exercise: true },
		})
	}

	async submitDailyTaskExercise(
		learnerId: number,
		dailyTaskId: number,
		dto: SubmitDailyTaskExerciseDto,
	) {
		// Fetch exercise with relational context (segment & module) for richer validation context
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: dto.exerciseId },
			include: {
				interestSegment: {
					include: { segment: true },
				},
			},
		})

		if (!exercise) {
			throw new Error(`Exercise with id ${dto.exerciseId} not found`)
		}

		// Get learner language (fallback to ENGLISH if missing)
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true },
		})
		const language: NATIVE_LANGUAGE = learner?.nativeLanguage || NATIVE_LANGUAGE.ENGLISH

		// Derive module & segment context for validation service
		const segmentId = exercise.interestSegment?.segment?.id
		const moduleId = exercise.interestSegment?.segment?.moduleId

		const answer: ExerciseAnswer = (dto.answer as ExerciseAnswer) ?? null
		const descriptor = await this.exerciseValidationService.validate(
			'daily',
			dto.exerciseId,
			answer,
			dto.isDontKnow ?? false,
			language,
			{ learnerId, moduleId: moduleId ?? 0, segmentId },
		)
		const validationResult = descriptor.result

		const dailyTaskExercise = await this.prisma.dailyTaskExercise.findFirst({
			where: {
				dailyTaskId,
				exerciseId: dto.exerciseId,
			},
		})

		if (dailyTaskExercise) {
			await this.prisma.dailyTaskExercise.update({
				where: {
					id: dailyTaskExercise.id,
				},
				data: {
					completed: true,
				},
			})
		}

		const dailyTask = await this.prisma.dailyTask.findUnique({
			where: { id: dailyTaskId },
			include: { exercises: true },
		})

		if (dailyTask && dailyTask.exercises.every(e => e.completed)) {
			await this.prisma.dailyTask.update({
				where: { id: dailyTaskId },
				data: { completed: true },
			})
			// Notify completion
			try {
				await this.notifications?.dailyTaskCompleted(learnerId, { dailyTaskId })
			} catch (e) {
				console.debug('dailyTaskCompleted notification failed', e)
			}
		}

		// Mongoose countDocuments expects direct filter (not nested under where)
		const previousAttemptCount = await this.exerciseAttemptModel.countDocuments({
			learnerId,
			exerciseId: dto.exerciseId,
		})

		await this.exerciseAttemptModel.create({
			learnerId: learnerId,
			exerciseId: dto.exerciseId,
			exerciseType: exercise.type,
			answer: dto.answer,
			isCorrect: validationResult.isCorrect,
			score: validationResult.score,
			feedback: validationResult.feedback,
			attemptNumber: previousAttemptCount + 1,
			timeSpent: 0,
		})

		return validationResult
	}

	/**
	 * Handle multipart audio pronunciation submission for daily tasks
	 */
	async submitPronunciationExercise(
		learnerId: number,
		dailyTaskId: number,
		file: Express.Multer.File,
		body: {
			exerciseId: number
			attemptId?: string
			attemptNumber?: number
			isDontKnow?: boolean
			language?: string
		},
	) {
		if (!file) throw new Error('No audio file uploaded')

		const exercise = await this.prisma.exercise.findUnique({ where: { id: body.exerciseId } })
		if (!exercise) throw new Error(`Exercise with id ${body.exerciseId} not found`)

		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true },
		})
		const language: NATIVE_LANGUAGE =
			typeof body.language === 'string' && body.language.length > 0
				? (body.language as NATIVE_LANGUAGE)
				: learner?.nativeLanguage || NATIVE_LANGUAGE.ENGLISH

		// Start S3 upload in background
		const ext =
			(file.mimetype && file.mimetype.split('/')[1]) ||
			(file.originalname && file.originalname.split('.').pop()) ||
			'ogg'
		const attemptMarker = body.attemptNumber ?? Date.now()
		const filename = `pronunciation/${learnerId}/${body.exerciseId}/${attemptMarker}.${ext}`
		const uploadPromise = this.s3
			.uploadAudio(filename, file.buffer, file.mimetype || 'audio/ogg')
			.then(key => key)
			.catch(err => {
				this.logger.error('S3 upload failed', err)
				return undefined
			})

		// Run ASR on buffer (critical path)
		const asr: AsrResult = await this.asrService.transcribeBuffer(file.buffer, language as string)
		const answer = { transcript: asr.transcript, confidence: asr.confidence }

		const segment = await this.prisma.segment.findUnique({
			where: { id: exercise.interestSegmentId },
		})
		const moduleId = segment?.moduleId
		const descriptor = await this.exerciseValidationService.validate(
			'daily',
			body.exerciseId,
			answer,
			body.isDontKnow ?? false,
			language,
			{ learnerId, moduleId: moduleId ?? 0, segmentId: segment?.id },
		)
		const validationResult = descriptor.result

		const previousAttemptCount = await this.exerciseAttemptModel.countDocuments({
			learnerId,
			exerciseId: body.exerciseId,
		})
		const created = await this.exerciseAttemptModel.create({
			learnerId,
			exerciseId: body.exerciseId,
			exerciseType: exercise.type,
			answer,
			isCorrect: validationResult.isCorrect,
			score: validationResult.score,
			feedback: validationResult.feedback,
			attemptNumber: previousAttemptCount + 1,
			timeSpent: 0,
			audioKey: undefined,
		})

		// When upload completes, update the attempt with audioKey
		void uploadPromise.then(async (key: string | undefined) => {
			if (!key) return
			try {
				await this.exerciseAttemptModel.findByIdAndUpdate(created._id, {
					$set: { audioKey: key, asrResult: asr },
				})
			} catch (e) {
				this.logger.error('Failed to patch attempt with audioKey', e)
			}
		})

		// Mark daily exercise completed if exists
		const dailyTaskExercise = await this.prisma.dailyTaskExercise.findFirst({
			where: { dailyTaskId, exerciseId: body.exerciseId },
		})
		if (dailyTaskExercise) {
			await this.prisma.dailyTaskExercise.update({
				where: { id: dailyTaskExercise.id },
				data: { completed: true },
			})
		}

		return validationResult
	}
}
