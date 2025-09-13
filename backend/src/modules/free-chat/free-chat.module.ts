import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { FreeChatController } from './free-chat.controller'
import { FreeChatService } from './free-chat.service'
import {
	FreeChat,
	FreeChatSchema,
	FreeChatMessage,
	FreeChatMessageSchema,
} from './schemas/free-chat.schema'
import { FreeChatSessionService } from './services/free-chat-session.service'
import { FreeChatMessageService } from './services/free-chat-message.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { CommonModule } from 'src/common/common.module'
import { AuthModule } from '../auth/auth.module'
import { OpenAIFreeChatAdapter } from './adapters/free-chat-openai.adapter'
import { LearnerProfileService } from '../auth/learner/services/learner-profile.service'
import { PrismaModule } from 'src/prisma/prisma.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { FreeChatNudgeScheduler } from './services/free-chat-nudge.scheduler'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: FreeChat.name, schema: FreeChatSchema },
			{ name: FreeChatMessage.name, schema: FreeChatMessageSchema },
		]),
		AppConfigModule,
		CommonModule,
		AuthModule,
		PrismaModule,
		NotificationsModule,
	],
	controllers: [FreeChatController],
	providers: [
		FreeChatService,
		FreeChatSessionService,
		FreeChatMessageService,
		FreeChatNudgeScheduler,
		{
			provide: 'FreeChatLLMAdapter',
			useClass: OpenAIFreeChatAdapter, // Using the existing OpenAI adapter for now
		},
		LearnerProfileService, // Ensure this service is imported if used in the service
	],
	exports: [FreeChatService],
})
export class FreeChatModule {}
