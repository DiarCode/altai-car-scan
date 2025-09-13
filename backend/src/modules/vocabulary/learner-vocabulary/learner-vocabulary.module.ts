// src\modules\vocabulary\learner-vocabulary\learner-vocabulary.module.ts

import { Module } from '@nestjs/common'
import { LearnerVocabularyController } from './learner-vocabulary.controller'
import { LearnerVocabularyService } from './learner-vocabulary.service'
import { OpenAIVocabularyExplanationAdapter } from 'src/common/adapters/openai-vocabulary-explanation.adapter'
import { AppConfigModule } from 'src/common/config/config.module'
import { CommonModule } from 'src/common/common.module'
import { AuthModule } from 'src/modules/auth/auth.module'
import { VocabReviewScheduler } from './vocab-review.scheduler'
import { NotificationsModule } from 'src/modules/notifications/notifications.module'
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
	imports: [AppConfigModule, CommonModule, AuthModule, PrismaModule, NotificationsModule],
	controllers: [LearnerVocabularyController],
	providers: [
		{
			provide: 'VocabularyExplanationAdapter',
			useClass: OpenAIVocabularyExplanationAdapter,
		},
		LearnerVocabularyService,
		VocabReviewScheduler,
	],
})
export class LearnerVocabularyModule {}
