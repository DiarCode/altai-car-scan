import { Module } from '@nestjs/common'
import { PromptRegistry } from './prompt.registry'
import { PromptBuilderService } from './prompt.builder'
import { OpenAiSegmentsAdapter } from '../adapters/openai-segment-generator.adapter'
import { PrismaModule } from 'src/prisma/prisma.module'
import { AppConfigModule } from '../config/config.module'

@Module({
	imports: [AppConfigModule, PrismaModule],
	providers: [
		PromptRegistry,
		PromptBuilderService,
		{
			provide: 'SegmentsAdapter',
			useClass: OpenAiSegmentsAdapter,
		},
	],
	exports: ['SegmentsAdapter', PromptBuilderService, PromptRegistry],
})
export class LlmModule {}
