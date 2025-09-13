import { Module } from '@nestjs/common'
import { DailyTasksController } from './daily-tasks.controller'
import { DailyTasksService } from './daily-tasks.service'
import { MongooseModule } from '@nestjs/mongoose'
import { ExerciseAttempt, ExerciseAttemptSchema } from '../chat/schemas/exercise-attempt.schema'
import { ExerciseValidationModule } from '../exercise-validation/exercise-validation.module'
import { ChatModule } from '../chat/chat.module'
import { MediaUrlService } from 'src/common/services/media-url.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { DailyTasksScheduler } from './services/daily-tasks.scheduler'
import { ASRModule } from '../asr/asr.module'
import { S3Module } from 'src/common/s3/s3.module'

@Module({
	imports: [
		AppConfigModule,
		CommonModule,
		AuthModule,
		MongooseModule.forFeature([{ name: ExerciseAttempt.name, schema: ExerciseAttemptSchema }]),
		ChatModule, // provides ChatLLMAdapter & exports ExerciseValidationService
		NotificationsModule,
		ExerciseValidationModule,
		ASRModule,
		S3Module,
	],
	controllers: [DailyTasksController],
	providers: [DailyTasksService, MediaUrlService, DailyTasksScheduler],
})
export class DailyTasksModule {}
