import { ApiProperty } from '@nestjs/swagger'
import { APPROVAL_STATUS } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'
import { BaseProficiencyLevelDto } from 'src/modules/proficiency-levels/dtos/proficiency-level.dtos'

export class CreateModuleDto {
	@IsString()
	@IsNotEmpty()
	title!: string

	@IsInt()
	@IsNotEmpty()
	proficiencyLevelId!: number

	@IsString()
	@IsNotEmpty()
	theoryContent!: string

	@IsString()
	@IsNotEmpty()
	outcomes!: string

	@IsString()
	@IsNotEmpty()
	description!: string
}

export class UpdateModuleDto {
	@IsOptional()
	@IsString()
	title: string

	@IsOptional()
	@IsInt()
	proficiencyLevelId: number

	@IsOptional()
	@IsString()
	theoryContent: string

	@IsOptional()
	@IsString()
	outcomes: string

	@IsOptional()
	@IsString()
	description: string

	@IsOptional()
	@IsEnum(APPROVAL_STATUS)
	status: APPROVAL_STATUS
}

export class ModulesFilter extends PaginationParamsFilter {
	@IsOptional()
	@IsString()
	search?: string

	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	proficiencyLevelId?: number

	@ApiProperty()
	@IsOptional()
	@IsString()
	@IsEnum(APPROVAL_STATUS)
	status?: APPROVAL_STATUS

	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	minTime?: number // filter modules whose total time >= this

	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	maxTime?: number // filter modules whose total time <= this
}

export class BaseModuleDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	title!: string

	@ApiProperty()
	theoryContent!: string

	@ApiProperty()
	outcomes!: string

	@ApiProperty()
	description!: string

	@ApiProperty()
	order!: number

	@ApiProperty()
	status!: string

	@ApiProperty({ type: BaseProficiencyLevelDto })
	@Type(() => BaseProficiencyLevelDto)
	level: BaseProficiencyLevelDto
}

export class ModuleSummaryDto extends BaseModuleDto {
	@ApiProperty()
	segmentCount!: number

	@ApiProperty()
	estimatedTime!: number

	@ApiProperty()
	publishedPercentage!: number
}
