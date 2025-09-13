// src/assessment/dto/assessment-test.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsInt,
	IsEnum,
	IsString,
	IsBoolean,
	IsOptional,
	IsArray,
	ValidateNested,
	Max,
	Min,
	IsNumber,
} from 'class-validator'
import { Type } from 'class-transformer'
import { LEVEL_CODE } from '@prisma/client'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'

//
// ─── GET /assessment-test QUERY ────────────────────────────────────────────────
//

export class AssessmentTestAdminFilter extends PaginationParamsFilter {
	@ApiPropertyOptional({ description: 'Filter by proficiency level ID' })
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	proficiencyLevelId?: number

	@ApiPropertyOptional({
		description: 'Filter by question/answers text (partial match)',
		example: 'What is',
	})
	@IsOptional()
	@IsString()
	search?: string
}

export class AdminAssessmentAnswerDto {
	@ApiProperty() @IsInt() id: number
	@ApiProperty() @IsString() answer: string
	@ApiProperty() @IsBoolean() isCorrect: boolean
}

export class AdminAssessmentQuestionDto {
	@ApiProperty()
	@IsInt()
	id: number

	@ApiProperty()
	@IsString()
	question: string

	@ApiPropertyOptional({
		description: 'Public URL of the question image',
		example: 'https://example.com/image.jpg',
	})
	imageUrl?: string

	@ApiProperty({
		description: 'Proficiency level code this question belongs to',
		enum: LEVEL_CODE,
	})
	proficiencyLevelCode: LEVEL_CODE

	@ApiProperty({ type: [AdminAssessmentAnswerDto] })
	@ValidateNested({ each: true })
	@Type(() => AdminAssessmentAnswerDto)
	answers: AdminAssessmentAnswerDto[]
}

//
// ─── LEARNER-FACING RESPONSES ──────────────────────────────────────────────────
//

export class AssessmentAnswerDto {
	@ApiProperty({ description: 'Answer ID' })
	@IsInt()
	id: number

	@ApiProperty({ description: 'Answer text' })
	@IsString()
	answer: string

	@ApiProperty({
		description: 'Whether this answer is correct',
		example: false,
	})
	@IsBoolean()
	isCorrect: boolean
}

export class AssessmentQuestionDto {
	@ApiProperty({ description: 'Question ID' })
	@IsInt()
	id: number

	@ApiProperty({ description: 'Question text' })
	@IsString()
	question: string

	@ApiPropertyOptional({ description: 'Public URL of the question image' })
	imageUrl?: string

	@ApiProperty({
		description: 'Proficiency level code this question belongs to',
		enum: LEVEL_CODE,
	})
	@IsEnum(LEVEL_CODE)
	proficiencyLevelCode: LEVEL_CODE

	@ApiProperty({
		description: 'All possible answers (learner will pick one)',
		type: [AssessmentAnswerDto],
	})
	@ValidateNested({ each: true })
	@Type(() => AssessmentAnswerDto)
	answers: AssessmentAnswerDto[]
}

export class AssessmentTestDto {
	@ApiProperty({
		description:
			'Questions organized by proficiency level. Only includes levels that exist in your app.',
		example: {
			A1: [
				/* AssessmentQuestionDto[] */
			],
			A2: [
				/* AssessmentQuestionDto[] */
			],
			B1: [
				/* AssessmentQue	stionDto[] */
			],
			B2: [
				/* AssessmentQuestionDto[] */
			],
			// C1 not included if it doesn't exist
		},
	})
	questions: Record<LEVEL_CODE, AssessmentQuestionDto[]>
}

//
// ─── ADMIN UPSERT DTOS ─────────────────────────────────────────────────────────
//

export class UpsertAnswerDto {
	@ApiProperty({ description: 'Answer ID (omit when creating new)' })
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	id?: number

	@ApiProperty({ description: 'Answer text' })
	@IsString()
	answer!: string

	@ApiProperty({ description: 'Whether this answer is correct' })
	@IsBoolean()
	@Type(() => Boolean)
	isCorrect!: boolean
}

export class UpsertQuestionDto {
	@ApiProperty({ description: 'Question ID (omit to create)' })
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	id?: number

	@ApiProperty({ description: 'Proficiency level ID', example: 1 })
	@IsInt()
	@Type(() => Number)
	proficiencyLevelId!: number

	@ApiProperty({ description: 'Question text' })
	@IsString()
	question!: string

	@ApiProperty({
		description: 'Answers array',
		type: [UpsertAnswerDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpsertAnswerDto)
	answers!: UpsertAnswerDto[]
}

//
// ─── LEARNER-SENT SUBMISSION DTOS ──────────────────────────────────────────────
//

export enum SELF_LEVEL {
	BEGINNER = 'BEGINNER', // A1-A2
	INTERMEDIATE = 'INTERMEDIATE', // B1-B2
	ADVANCED = 'ADVANCED', // C1
}

export class AssessmentTestFilter {
	@ApiProperty({
		description: 'Number of questions per level (applies to all levels A1-C1)',
		example: 3,
		default: 3,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10)
	questionsPerLevel?: number = 3
}

export class LevelScoreDto {
	@ApiProperty({
		description: 'A1 level correct answers count (null if not tested)',
		example: 2,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	A1?: number | null

	@ApiProperty({
		description: 'A2 level correct answers count (null if not tested)',
		example: 1,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	A2?: number | null

	@ApiProperty({
		description: 'B1 level correct answers count (null if not tested)',
		example: 0,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	B1?: number | null

	@ApiProperty({
		description: 'B2 level correct answers count (null if not tested)',
		example: null,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	B2?: number | null

	@ApiProperty({
		description: 'C1 level correct answers count (null if not tested)',
		example: null,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	C1?: number | null
}

export class SubmitAssessmentTestDto {
	@ApiProperty({
		description: "Learner's self-selected starting level",
		enum: SELF_LEVEL,
		example: SELF_LEVEL.INTERMEDIATE,
	})
	@IsEnum(SELF_LEVEL)
	selfLevel: SELF_LEVEL

	@ApiProperty({
		description: 'Questions per level that were tested',
		example: 3,
	})
	@IsInt()
	@Min(1)
	questionsPerLevel: number

	@ApiProperty({
		description: 'Scores per level (null means level was not tested)',
		type: LevelScoreDto,
	})
	@ValidateNested()
	@Type(() => LevelScoreDto)
	answers: LevelScoreDto
}

export class SubmitAssessmentTestResponseDto {
	@ApiProperty({
		description: 'Total percentage score (0–100) across all tested levels',
		example: 75,
	})
	@IsNumber()
	@Min(0)
	@Max(100)
	totalScorePercent: number

	@ApiProperty({
		description: 'Assigned LEVEL_CODE after applying adaptive placement algorithm',
		enum: LEVEL_CODE,
		example: LEVEL_CODE.B1,
	})
	@IsEnum(LEVEL_CODE)
	assignedLevel: LEVEL_CODE

	@ApiProperty({
		description: 'Breakdown of scores per level (null means level was not tested)',
		type: LevelScoreDto,
	})
	levelBreakdown: LevelScoreDto

	@ApiProperty({
		description: 'Detailed explanation of level assignment based on adaptive test progression',
		example:
			'Excellent performance! Mastered B1 level (100%). Ready for advanced content at this level.',
	})
	@IsString()
	explanation: string
}
