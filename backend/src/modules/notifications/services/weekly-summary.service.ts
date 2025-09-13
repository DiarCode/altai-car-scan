import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import {
	ExerciseAttempt,
	ExerciseAttemptDocument,
} from 'src/modules/chat/schemas/exercise-attempt.schema'
import { startOfWeek, endOfWeek } from 'date-fns'
import { WeeklySummaryDto } from '../dtos/weekly-summary.dto'

@Injectable()
export class WeeklySummaryService {
	constructor(
		private readonly prisma: PrismaService,
		@InjectModel(ExerciseAttempt.name)
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
	) {}

	async getCurrentWeekSummary(
		learnerId: number,
		weekStartsOn: 1 | 0 = 1,
	): Promise<WeeklySummaryDto> {
		const now = new Date()
		const from = startOfWeek(now, { weekStartsOn })
		const to = endOfWeek(now, { weekStartsOn })

		// Words learnt: count of LearnerVocabulary created in week
		const wordsLearnt = await this.prisma.learnerVocabulary.count({
			where: { learnerId, createdAt: { gte: from, lte: to } },
		})

		// Exercises: use attempts in Mongo
		const [completed, failed] = await Promise.all([
			this.attemptModel.countDocuments({
				learnerId,
				createdAt: { $gte: from, $lte: to },
				isCorrect: true,
			}),
			this.attemptModel.countDocuments({
				learnerId,
				createdAt: { $gte: from, $lte: to },
				isCorrect: false,
			}),
		])

		// Daily task completion count
		const dailyTasksCompleted = await this.prisma.dailyTask.count({
			where: { learnerId, completed: true, createdAt: { gte: from, lte: to } },
		})

		return {
			wordsLearnt,
			exercises: { completed, failed },
			progress: { dailyTasksCompleted, days: 7 },
		}
	}
}
