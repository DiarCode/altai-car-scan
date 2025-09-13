// src/modules/vocabulary/learner-vocabulary/dtos/learner-vocabulary.dtos.ts

import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDate, IsInt, IsOptional, IsString } from 'class-validator'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'

/** DTO for a learner's vocabulary item */
export class LearnerVocabularyDto {
	@ApiProperty({ description: 'ID of this learner-specific vocabulary record' })
	@IsInt()
	id!: number

	@ApiProperty({ description: 'The word itself' })
	@IsString()
	word!: string

	@ApiProperty({ description: 'Stored translation in native language' })
	@IsString()
	translation!: string

	@ApiProperty({ description: 'Stored description in native language' })
	@IsString()
	description!: string

	@ApiProperty({ description: 'Example sentence in Kazakh' })
	@IsString()
	@IsOptional()
	example?: string
}

/** DTO for a learner's vocabulary progress */
export class LearnerVocabularyProgressDto {
	@ApiProperty({ description: 'ID of the progress record' })
	@IsInt()
	id!: number

	@ApiProperty({ description: 'Learner ID' })
	@IsInt()
	learnerId!: number

	@ApiProperty({ description: 'Learner Vocabulary ID' })
	@IsInt()
	learnerVocabularyId!: number

	@ApiProperty({ description: 'Current mastery level' })
	@IsInt()
	masteryLevel!: number

	@ApiProperty({ description: 'Current streak' })
	@IsInt()
	streak!: number

	@ApiProperty({ description: 'Next review date' })
	@IsDate()
	nextReviewAt!: Date
}

/** Response when a learner “memorizes” a new word */
export class MemorizeResponseDto {
	@ApiProperty({ description: 'New mastery level after memorization' })
	@IsInt()
	masteryLevel!: number

	@ApiProperty({ description: 'When to next review this word' })
	@IsDate()
	nextReviewAt!: Date
}

/** Response when a learner asks for an explanation */
export class ExplainResponseDto {
	@ApiProperty({ description: 'AI-generated explanation for the word' })
	@IsString()
	explanation!: string

	@ApiProperty({ description: 'Current mastery level after explanation' })
	@IsInt()
	masteryLevel!: number

	@ApiProperty({ description: 'Next scheduled review after explanation' })
	@IsDate()
	nextReviewAt!: Date
}

/** Single item in the “due review” list */
export class ReviewItemDto {
	@ApiProperty({ description: 'ID of this learner-specific vocabulary record' })
	@IsInt()
	learnerVocabularyId!: number

	@ApiProperty({ description: 'The word itself' })
	@IsString()
	word!: string

	@ApiProperty({ description: 'Stored translation in native language' })
	@IsString()
	translation!: string

	@ApiProperty({ description: 'Stored description in native language' })
	@IsString()
	description!: string

	@ApiProperty({ description: 'Example sentence in Kazakh' })
	@IsString()
	example!: string

	@ApiProperty({ description: 'Learner’s current mastery level' })
	@IsInt()
	masteryLevel!: number
}

/** Body payload for submitting a review answer */
export class ReviewAnswerDto {
	@ApiProperty({ description: 'Was the learner correct?' })
	@IsBoolean()
	correct!: boolean
}

/** Response after submitting a review answer */
export class ReviewAnswerResponseDto {
	@ApiProperty({ description: 'Updated mastery level' })
	@IsInt()
	masteryLevel!: number

	@ApiProperty({ description: 'Streak' })
	@IsInt()
	streak!: number

	@ApiProperty({ description: 'Next scheduled review time' })
	@IsDate()
	nextReviewAt!: Date
}

export class LearnerVocabularyFilter extends PaginationParamsFilter {
	@ApiProperty({
		description: 'Optional search term to filter vocabulary by word or translation',
		required: false,
	})
	@IsString()
	@IsOptional()
	search?: string
}
