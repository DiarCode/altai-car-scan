import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { NotificationsService, NotificationsApi } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { ExpoPushProvider } from './providers/expo-push.provider'
import { MongooseModule } from '@nestjs/mongoose'
import { ExerciseAttempt, ExerciseAttemptSchema } from '../chat/schemas/exercise-attempt.schema'
import { WeeklySummaryService } from './services/weekly-summary.service'
import { WeeklySummaryScheduler } from './services/weekly-summary.scheduler'
import { NotificationsQueueConsumer } from 'src/modules/notifications/services/notifications-queue.consumer'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'
import { WeeklySummaryLlmService } from './services/weekly-summary-llm.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { OpenAIWeeklySummaryAdapter } from 'src/common/adapters/openai-weekly-summary.adapter'

@Module({
	imports: [
		PrismaModule,
		AuthModule,
		CommonModule,
		AppConfigModule,
		MongooseModule.forFeature([{ name: ExerciseAttempt.name, schema: ExerciseAttemptSchema }]),
	],
	providers: [
		NotificationsService,
		ExpoPushProvider,
		NotificationsApi,
		WeeklySummaryService,
		WeeklySummaryScheduler,
		NotificationsQueueConsumer,
		WeeklySummaryLlmService,
		{
			provide: 'WeeklySummaryAdapter',
			useClass: OpenAIWeeklySummaryAdapter,
		},
	],
	controllers: [NotificationsController],
	exports: [NotificationsService, NotificationsApi, WeeklySummaryService],
})
export class NotificationsModule {}
