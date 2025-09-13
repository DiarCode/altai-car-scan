// src/modules/chat/chat.module.ts

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ChatMessageService } from './services/chat-message.service'
import { ChatSessionService } from './services/chat-session.service'
import { ChatContextService } from './services/chat-context.service'
import { ChatFlowStateService } from './services/chat-flow-state.service'
import { LearnerProgressService } from './services/learner-progress.service'
import { ExerciseValidationModule } from 'src/modules/exercise-validation/exercise-validation.module'
import { VocabularyService } from './services/vocabulary.service'
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema'
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema'
import { LearnerProgress, LearnerProgressSchema } from './schemas/learner-progress.schema'
import { ExerciseAttempt, ExerciseAttemptSchema } from './schemas/exercise-attempt.schema'
import { OpenAIChatAdapter } from './adapters/openai-chat.adapter'
import { PrismaModule } from 'src/prisma/prisma.module'
import { CommonModule } from 'src/common/common.module'
import { AuthModule } from '../auth/auth.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ContentService } from './services/content.service'
import { ChatFlowService } from './services/chat-flow.service'
import { FeedbackService } from './services/feedback.service'
import { ProficiencyLevelsModule } from '../proficiency-levels/proficiency-levels.module'
import { ProficiencyLevelsService } from '../proficiency-levels/proficiency-levels.service'
import { ModulesModule } from '../modules/modules.module'
import { ModulesService } from '../modules/modules.service'
import { ChatSummarizationService } from './services/chat-summarization.service'
import { S3Module } from 'src/common/s3/s3.module'
import { ChatPromptBuilderService } from './services/chat-prompt-builder/chat-prompt-builder.service'
import { ChatPromptConfigService } from './services/chat-prompt-builder/chat-prompt-config.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { ChatInactivityScheduler } from './services/chat-inactivity.scheduler'
import { ASRModule } from '../asr/asr.module'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ChatMessage.name, schema: ChatMessageSchema },
			{ name: ChatSession.name, schema: ChatSessionSchema },
			{ name: LearnerProgress.name, schema: LearnerProgressSchema },
			{ name: ExerciseAttempt.name, schema: ExerciseAttemptSchema },
		]),
		PrismaModule,
		CommonModule,
		AuthModule,
		AppConfigModule,
		ProficiencyLevelsModule,
		ModulesModule,
		ASRModule,
		NotificationsModule,
		ExerciseValidationModule,
		S3Module,
	],
	controllers: [ChatController],
	providers: [
		// Core services
		ChatService,
		ChatMessageService,
		ChatSessionService,
		ChatContextService,
		ContentService,
		ChatFlowService,
		ProficiencyLevelsService,
		ModulesService,

		// Learning flow services
		ChatFlowStateService,
		LearnerProgressService,
		VocabularyService,
		FeedbackService,
		ChatPromptConfigService,
		ChatPromptBuilderService,
		ChatSummarizationService,
		ChatInactivityScheduler,

		// Adapters
		{
			provide: 'ChatLLMAdapter',
			useClass: OpenAIChatAdapter,
		},
		ASRModule,
	],
	exports: [
		ChatService,
		ChatMessageService,
		ChatSessionService,
		ChatContextService,
		LearnerProgressService,
		VocabularyService,
		'ChatLLMAdapter',
		ChatPromptConfigService,
		ChatPromptBuilderService,
		ChatSummarizationService,
	],
})
export class ChatModule {}
