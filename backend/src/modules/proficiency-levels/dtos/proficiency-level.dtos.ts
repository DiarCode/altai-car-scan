import { Optional } from '@nestjs/common'
import { PartialType } from '@nestjs/mapped-types'
import { ApiProperty } from '@nestjs/swagger'
import { LEVEL_CODE } from '@prisma/client'
import { Type } from 'class-transformer'
import {
	IsString,
	IsNotEmpty,
	ArrayMinSize,
	ArrayNotEmpty,
	IsInt,
	ValidateNested,
	IsEnum,
} from 'class-validator'

export class CreateProficiencyLevelDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@IsEnum(LEVEL_CODE)
	code!: LEVEL_CODE

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	title!: string

	@ApiProperty()
	@IsString()
	@Optional()
	description!: string
}

export class UpdateProficiencyLevelDto extends PartialType(CreateProficiencyLevelDto) {}

export class ModuleOrderItemDto {
	@ApiProperty()
	@IsInt()
	moduleId!: number

	@ApiProperty()
	@IsInt()
	order!: number
}

export class ReorderModulesDto {
	@ApiProperty()
	@ArrayNotEmpty()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => ModuleOrderItemDto)
	items!: ModuleOrderItemDto[]
}

export class BaseProficiencyLevelDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	code!: LEVEL_CODE

	@ApiProperty()
	title!: string

	@ApiProperty()
	description!: string
}

export class ProficiencyLevelSummaryDto extends BaseProficiencyLevelDto {
	@ApiProperty()
	moduleCount!: number

	@ApiProperty()
	estimatedTime!: number // sum across all modules

	@ApiProperty()
	publishedPercentage!: number // floor(totalPublishedSegments / totalSegments * 100)
}
