import { Module } from '@nestjs/common'
import { OpenAiExercisesAdapter } from 'src/common/adapters/openai-exercises-generator.adapter'
import { PromptBuilderService } from 'src/common/llm/prompt.builder'
import { PromptRegistry } from 'src/common/llm/prompt.registry'
import { PrismaService } from 'src/prisma/prisma.service'
import { ExercisesController } from './exercises.controller'
import { ExercisesService } from './exercises.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { LlmModule } from 'src/common/llm/llm.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { MediaModule } from './media/media.module'
import { CommonModule } from 'src/common/common.module'
import { AuthModule } from '../auth/auth.module'
import { StubExercisesAdapter } from 'src/common/adapters/stub/stub-exercises.adapter'

@Module({
	imports: [
		AppConfigModule,
		PrismaModule,
		LlmModule,
		MediaModule,
		AuthModule,
		CommonModule,
		MediaModule,
	],
	providers: [
		PrismaService,
		PromptRegistry,
		PromptBuilderService,
		{
			provide: 'ExercisesAdapter',
			useClass:
				process.env.USE_STUB_ADAPTER === 'true' ? StubExercisesAdapter : OpenAiExercisesAdapter,
		},
		ExercisesService,
	],
	controllers: [ExercisesController],
	exports: [ExercisesService],
})
export class ExercisesModule {}
