import { Module } from '@nestjs/common'
import { AppConfigModule } from 'src/common/config/config.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SegmentsService } from './segments.service'
import { SegmentsController } from './segments.controller'
import { OpenAiSegmentsAdapter } from 'src/common/adapters/openai-segment-generator.adapter'
import { LlmModule } from 'src/common/llm/llm.module'
import { InterestSegmentsController } from './interest-segments.controller'
import { CommonModule } from 'src/common/common.module'
import { AuthModule } from '../auth/auth.module'
import { StubSegmentsAdapter } from 'src/common/adapters/stub/stub-segments.adapter'

@Module({
	imports: [AppConfigModule, PrismaModule, LlmModule, AuthModule, CommonModule],
	providers: [
		{
			provide: 'SegmentsAdapter',
			useClass:
				process.env.USE_STUB_ADAPTER === 'true' ? StubSegmentsAdapter : OpenAiSegmentsAdapter,
		},
		SegmentsService,
	],
	controllers: [InterestSegmentsController, SegmentsController],
})
export class SegmentsModule {}
