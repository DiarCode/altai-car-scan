import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/prisma/prisma.service'
import { DailyTasksService } from '../daily-tasks.service'
import { BossService } from 'src/common/queue/boss.service'

@Injectable()
export class DailyTasksScheduler {
	private readonly logger = new Logger(DailyTasksScheduler.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly dailyTasks: DailyTasksService,
		private readonly boss: BossService,
	) {}

	// Morning job to ensure every learner has a task
	@Cron(CronExpression.EVERY_DAY_AT_7AM)
	async ensureDailyTasks() {
		const learners = await this.prisma.learner.findMany({ select: { id: true } })
		for (const l of learners) {
			try {
				await this.dailyTasks.getDailyTask(l.id) // internally creates (and notifies) if missing
			} catch (e) {
				this.logger.debug(`ensureDailyTasks failed for ${l.id}: ${e}`)
			}
		}
	}

	// Evening job to notify incomplete tasks
	@Cron(CronExpression.EVERY_DAY_AT_9PM)
	async remindIncompleteTasks() {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const tasks = await this.prisma.dailyTask.findMany({
			where: { createdAt: { gte: today, lt: tomorrow }, completed: false },
			select: { id: true, learnerId: true },
		})
		for (const t of tasks) {
			try {
				await this.boss.publish('notifications.daily-task-incomplete', {
					learnerId: t.learnerId,
					data: { dailyTaskId: t.id },
				})
			} catch (e) {
				this.logger.debug(`dailyTaskIncomplete failed for ${t.id}: ${e}`)
			}
		}
	}
}
