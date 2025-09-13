import { ApiProperty } from '@nestjs/swagger'
import { APPROVAL_STATUS, INTEREST } from '@prisma/client'
import { Type } from 'class-transformer'
import {
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'
import { BaseModuleDto } from 'src/modules/modules/dtos/modules.dtos'

export class GenerateSegmentsDto {
	@ApiProperty()
	@IsInt()
	moduleId!: number

	@ApiProperty()
	@IsInt()
	@IsOptional()
	count?: number
}

export class UpdateSegmentDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	theoryContent?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsInt()
	@Min(1)
	timeToComplete?: number

	@ApiProperty({ required: false, enum: APPROVAL_STATUS })
	@IsOptional()
	@IsEnum(APPROVAL_STATUS)
	status?: APPROVAL_STATUS
}

export class InterestSegmentDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	segmentId!: number

	@ApiProperty()
	theoryContent!: string

	@ApiProperty({ enum: INTEREST })
	@IsEnum(INTEREST)
	interest!: INTEREST

	@ApiProperty()
	createdAt!: Date

	@ApiProperty()
	updatedAt!: Date
}

export class BaseSegmentDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	title!: string

	@ApiProperty()
	theoryContent!: string

	@ApiProperty()
	order!: number

	@ApiProperty()
	timeToComplete!: number

	@ApiProperty({ enum: APPROVAL_STATUS })
	@IsEnum(APPROVAL_STATUS)
	status!: APPROVAL_STATUS

	@ApiProperty()
	createdAt!: Date

	@ApiProperty()
	updatedAt!: Date
}

export class SegmentDetailDto extends BaseSegmentDto {
	@ApiProperty({ type: BaseModuleDto })
	@Type(() => BaseModuleDto)
	module!: BaseModuleDto

	@ApiProperty({ type: [InterestSegmentDto], required: false })
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => InterestSegmentDto)
	interestSegments?: InterestSegmentDto[]
}

export class SegmentsFilter extends PaginationParamsFilter {
	@ApiProperty({ required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	moduleId?: number

	@ApiProperty({ required: false, enum: APPROVAL_STATUS })
	@IsOptional()
	@IsEnum(APPROVAL_STATUS)
	status?: APPROVAL_STATUS

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	search?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	minTimeToComplete?: number

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	maxTimeToComplete?: number
}

export class MergeSegmentsDto {
	@ApiProperty({ description: 'ID of the module containing these segments' })
	@IsInt()
	@Type(() => Number)
	moduleId!: number

	@ApiProperty({
		description: 'List of segment IDs to merge, in their current order',
		type: [Number],
	})
	@IsArray()
	@ArrayMinSize(2)
	@IsInt({ each: true })
	@Type(() => Number)
	segmentIds!: number[]
}

export class GenerateInterestSegmentDto {
	@ApiProperty()
	@IsInt()
	@Min(1)
	segmentId!: number

	@ApiProperty()
	@IsEnum(INTEREST)
	interest!: INTEREST
}

export class GenerateInterestSegmentsDto {
	@ApiProperty({ description: 'ID of the base segment', example: 42 })
	@IsInt()
	@Min(1)
	segmentId!: number

	@ApiProperty({
		description: 'List of learner interests',
		isArray: true,
		enum: INTEREST,
		example: ['MUSIC', 'SPORTS'],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsEnum(INTEREST, { each: true })
	interests!: INTEREST[]
}

export class InterestSegmentsFilter extends PaginationParamsFilter {
	@ApiProperty({ required: false })
	@IsOptional()
	@Type(() => Number)
	segmentId?: number

	@ApiProperty({ required: false, enum: INTEREST })
	@IsOptional()
	@IsEnum(INTEREST)
	interest?: INTEREST
}

export class UpdateInterestSegmentDto {
	@ApiProperty({ required: false, enum: INTEREST })
	@IsOptional()
	@IsEnum(INTEREST)
	interest?: INTEREST

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	theoryContent?: string
}

class ReorderSegmentsItem {
	@ApiProperty({ description: 'ID of the segment to reorder' })
	@IsInt()
	@Type(() => Number)
	segmentId!: number

	@ApiProperty({ description: 'New 1-based order for that segment' })
	@IsInt()
	@Min(1)
	@Type(() => Number)
	order!: number
}

export class ReorderSegmentsDto {
	@ApiProperty({
		description:
			'An array of { segmentId, order } objects. Must include every segment of the module exactly once.',
		type: [ReorderSegmentsItem],
	})
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => ReorderSegmentsItem)
	items!: ReorderSegmentsItem[]
}
