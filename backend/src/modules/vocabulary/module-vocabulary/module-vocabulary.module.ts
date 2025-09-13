// src\modules\vocabulary\module-vocabulary\module-vocabulary.module.ts

import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ModuleVocabularyService } from './module-vocabulary.service'
import { ModuleVocabularyController } from './module-vocabulary.controller'

@Module({
	imports: [PrismaModule],
	controllers: [ModuleVocabularyController],
	providers: [ModuleVocabularyService],
})
export class ModuleVocabularyModule {}
