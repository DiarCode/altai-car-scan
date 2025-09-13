// src/modules/vocabulary/vocabulary.module.ts

import { Module } from '@nestjs/common'
import { ModuleVocabularyModule } from './module-vocabulary/module-vocabulary.module'
import { LearnerVocabularyModule } from './learner-vocabulary/learner-vocabulary.module'
import { AuthModule } from '../auth/auth.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { CommonModule } from 'src/common/common.module'

@Module({
	imports: [
		AppConfigModule,
		CommonModule,
		AuthModule,
		ModuleVocabularyModule,
		LearnerVocabularyModule,
	],
})
export class VocabularyModule {}
