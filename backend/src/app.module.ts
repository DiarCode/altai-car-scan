import { ConfigModule, ConfigService } from '@nestjs/config'
import { DevtoolsModule } from '@nestjs/devtools-integration'
import { LoggerModule } from 'nestjs-pino'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'

import { PrismaModule } from './prisma/prisma.module'
import { AdminAuthModule } from './modules/auth/admin/admin-auth.module'
import { LearnerAuthModule } from './modules/auth/learner/learner-auth.module'
import { ProficiencyLevelsModule } from './modules/proficiency-levels/proficiency-levels.module'
import { AdminManagementModule } from './modules/admin-management/admin-management.module'
import { ModulesModule } from './modules/modules/modules.module'
import { AppConfigModule } from './common/config/config.module'
import { SegmentsModule } from './modules/segments/segments.module'
import { ExercisesModule } from './modules/exercises/exercises.module'
import { VocabularyModule } from './modules/vocabulary/vocabulary.module'
import { AssessmentModule } from './modules/assessment/assessment.module'
import { TranslationsModule } from './modules/translations/translations.module'
import { MongooseModule } from '@nestjs/mongoose'
import { ChatModule } from './modules/chat/chat.module'
import { FreeChatModule } from './modules/free-chat/free-chat.module'
import { SecurityMiddleware } from './common/middleware/security.middleware'
import { DailyTasksModule } from './modules/daily-tasks/daily-tasks.module'
import { TtsModule } from './modules/tts/tts.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ScheduleModule } from '@nestjs/schedule'
import { BossModule } from './common/queue/boss.module'

@Module({
	imports: [
		// Dev / logging
		DevtoolsModule.register({ http: process.env.NODE_ENV !== 'production' }),
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
				transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
			},
		}),

		// Global config & DB
		ConfigModule.forRoot({ isGlobal: true }),
		AppConfigModule,
		ScheduleModule.forRoot(),
		BossModule,
		PrismaModule,
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
			}),
			inject: [ConfigService],
		}),

		// authentication
		AdminAuthModule,
		LearnerAuthModule,

		// feature modules
		AdminManagementModule,
		ProficiencyLevelsModule,
		ModulesModule,
		SegmentsModule,
		ExercisesModule,
		VocabularyModule,
		AssessmentModule,
		TranslationsModule,

		ChatModule,
		FreeChatModule,
		DailyTasksModule,
		TtsModule,
		NotificationsModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SecurityMiddleware).forRoutes('*')
	}
}
