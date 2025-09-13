// src\modules\vocabulary\module-vocabulary\utils\vocabulary.mapper.ts

import { ModuleVocabulary, ModuleVocabularyTranslation } from '@prisma/client'
import { BaseModuleVocabularyDto } from '../dtos/module-vocabulary.dtos'

type ModuleVocabularyWithRelations = ModuleVocabulary & {
	translations: ModuleVocabularyTranslation[]
}

export function toBaseModuleVocabularyDto(
	m: ModuleVocabularyWithRelations,
): BaseModuleVocabularyDto {
	const dto = new BaseModuleVocabularyDto()
	dto.id = m.id
	dto.moduleId = m.moduleId
	dto.word = m.word
	dto.translations = m.translations.map(t => ({
		language: t.language,
		translation: t.translation,
		description: t.description ?? undefined,
	}))
	dto.example = m.example ?? undefined
	dto.createdAt = m.createdAt
	dto.updatedAt = m.updatedAt
	return dto
}
