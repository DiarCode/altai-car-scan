import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ExerciseValidationService } from 'src/modules/exercise-validation/exercise-validation.service'
import { ExerciseValidationFacadeService } from './exercise-validation.facade.service'
import { ExerciseAttempt, ExerciseAttemptSchema } from '../chat/schemas/exercise-attempt.schema'
import { CommonModule } from 'src/common/common.module'
import { OpenAIChatAdapter } from '../chat/adapters/openai-chat.adapter'
import { AppConfigModule } from 'src/common/config/config.module'
import { LearnerProgressService } from '../chat/services/learner-progress.service'
import { LearnerProgress, LearnerProgressSchema } from '../chat/schemas/learner-progress.schema'
import { ChatPromptBuilderService } from '../chat/services/chat-prompt-builder/chat-prompt-builder.service'
import { ChatPromptConfigService } from '../chat/services/chat-prompt-builder/chat-prompt-config.service'

@Module({
	imports: [
		AppConfigModule,

		CommonModule,
		MongooseModule.forFeature([{ name: ExerciseAttempt.name, schema: ExerciseAttemptSchema }]),
		MongooseModule.forFeature([{ name: LearnerProgress.name, schema: LearnerProgressSchema }]),
		PrismaModule,
	],
	providers: [
		ExerciseValidationService,
		{
			provide: 'ChatLLMAdapter',
			useClass: OpenAIChatAdapter,
		},
		ChatPromptBuilderService,
		ChatPromptConfigService,
		LearnerProgressService,
		ExerciseValidationFacadeService,
	],
	exports: [ExerciseValidationService, ExerciseValidationFacadeService],
})
export class ExerciseValidationModule {}
