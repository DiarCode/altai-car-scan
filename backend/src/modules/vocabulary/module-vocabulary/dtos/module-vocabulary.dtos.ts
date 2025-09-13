// src/modules/vocabulary/module-vocabulary/dtos/module-vocabulary.dtos.ts

import { ApiProperty } from '@nestjs/swagger'
import {
	IsInt,
	IsString,
	IsOptional,
	IsDate,
	ValidateNested,
	ArrayMinSize,
	IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'
import { NATIVE_LANGUAGE } from '@prisma/client'

class TranslationDto {
	@ApiProperty({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	language!: NATIVE_LANGUAGE

	@ApiProperty()
	@IsString()
	translation!: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	description?: string
}

/** ─── MODULE VOCABULARY ────────────────────────────────────────────────────── */
export class BaseModuleVocabularyDto {
	@ApiProperty()
	@IsInt()
	id!: number

	@ApiProperty()
	@IsInt()
	moduleId!: number

	@ApiProperty()
	@IsString()
	word!: string

	@ApiProperty({ type: [TranslationDto] })
	@ValidateNested({ each: true })
	@Type(() => TranslationDto)
	translations!: TranslationDto[]

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	example?: string

	@ApiProperty()
	@IsDate()
	createdAt!: Date

	@ApiProperty()
	@IsDate()
	updatedAt!: Date
}

export class CreateModuleVocabularyDto {
	@ApiProperty()
	@IsInt()
	moduleId!: number

	@ApiProperty()
	@IsString()
	word!: string

	@ApiProperty({ type: [TranslationDto] })
	@ValidateNested({ each: true })
	@Type(() => TranslationDto)
	@ArrayMinSize(1)
	translations!: TranslationDto[]

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	example?: string
}

export class UpdateModuleVocabularyDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	word?: string

	@ApiProperty({ type: [TranslationDto], required: false })
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TranslationDto)
	@ArrayMinSize(1)
	translations?: TranslationDto[]

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	example?: string
}

/** Bulk-upsert new module vocabulary items */
export class BulkUpsertModuleVocabularyDto {
	@ApiProperty({ type: [CreateModuleVocabularyDto] })
	@ValidateNested({ each: true })
	@Type(() => CreateModuleVocabularyDto)
	@ArrayMinSize(1)
	entries!: CreateModuleVocabularyDto[]
}

/** Filter for listing ModuleVocabulary */
export class ModuleVocabularyFilterDto extends PaginationParamsFilter {
	@ApiProperty({ required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	moduleId?: number

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	search?: string
}
