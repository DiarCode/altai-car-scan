import { Module } from '@nestjs/common'
import { TranslationsService } from './translations.service'
import { TranslationsController } from './translations.controller'
import { PrismaModule } from 'src/prisma/prisma.module'
import { LlmModule } from 'src/common/llm/llm.module'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { PromptBuilderService } from 'src/common/llm/prompt.builder'
import { PromptRegistry } from 'src/common/llm/prompt.registry'
import { PrismaService } from 'src/prisma/prisma.service'
import { OpenAiTranslationsAdapter } from 'src/common/adapters/openai-translations.adapter'

@Module({
	imports: [AppConfigModule, PrismaModule, LlmModule, AuthModule, CommonModule],
	controllers: [TranslationsController],
	providers: [
		PrismaService,
		PromptRegistry,
		PromptBuilderService,
		{
			provide: 'TranslationsAdapter',
			useClass: OpenAiTranslationsAdapter,
		},
		TranslationsService,
	],
	exports: [TranslationsService],
})
export class TranslationsModule {}
