import { APPROVAL_STATUS, EXERCISE_TYPE } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator'
import {
	ClozePayload,
	DictationPayload,
	FlashcardPayload,
	ListeningQuizPayload,
	MultipleChoicePayload,
	PictureDescriptionPayload,
	PronunciationPayload,
	SentenceReorderPayload,
} from './exercise-payload.types'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'
import { Type } from 'class-transformer'

export class ExercisesFilter extends PaginationParamsFilter {
	@ApiProperty({
		description: 'ID of the interest segment to filter exercises by',
		example: 1,
		required: false,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	interestSegmentId?: number

	@ApiProperty({
		description: 'Type of exercise to filter by',
		enum: EXERCISE_TYPE,
		required: false,
	})
	@IsOptional()
	@IsEnum(EXERCISE_TYPE)
	type?: EXERCISE_TYPE
}

export class GenerateExerciseDto {
	@ApiProperty({ description: 'ID of the interest segment', example: 1 })
	@IsInt()
	@Min(1)
	interestSegmentId!: number

	@ApiProperty({ description: 'Type of exercise to generate' })
	@IsEnum(EXERCISE_TYPE)
	type!: EXERCISE_TYPE
}

export type ExercisePayload =
	| FlashcardPayload
	| ClozePayload
	| SentenceReorderPayload
	| MultipleChoicePayload
	| DictationPayload
	| ListeningQuizPayload
	| PronunciationPayload
	| PictureDescriptionPayload

export class UpdateExerciseDto {
	@IsOptional()
	@IsString()
	title?: string

	@IsOptional()
	@IsEnum(APPROVAL_STATUS)
	status?: APPROVAL_STATUS

	@IsOptional()
	@IsObject({ message: 'payload must be a plain object' })
	payload?: ExercisePayload
}

export class ChangeExerciseStatusDto {
	@IsEnum(APPROVAL_STATUS, { message: 'status must be DRAFT or PUBLISHED' })
	status!: APPROVAL_STATUS
}

/** Base fields returned for every exercise */
export interface BaseExerciseDto {
	id: number
	title: string
	interestSegmentId: number
	type: EXERCISE_TYPE
	status: APPROVAL_STATUS
	createdAt: Date
	updatedAt: Date
}

/** 1) FLASHCARD */
export interface FlashcardExerciseDto extends BaseExerciseDto, FlashcardPayload {
	type: typeof EXERCISE_TYPE.FLASHCARD
}

/** 2) CLOZE TEST */
export interface ClozeExerciseDto extends BaseExerciseDto, ClozePayload {
	type: typeof EXERCISE_TYPE.CLOZE
}

/** 3) SENTENCE REORDER */
export interface SentenceReorderExerciseDto extends BaseExerciseDto, SentenceReorderPayload {
	type: typeof EXERCISE_TYPE.SENTENCE_REORDER
}

/** 4) MULTIPLE-CHOICE */
export interface MultipleChoiceExerciseDto extends BaseExerciseDto, MultipleChoicePayload {
	type: typeof EXERCISE_TYPE.MULTIPLE_CHOICE
}

/** 5) DICTATION */
export interface DictationExerciseDto extends BaseExerciseDto, DictationPayload {
	type: typeof EXERCISE_TYPE.DICTATION
}

/** 6) INTERACTIVE LISTENING QUIZ */
export interface ListeningQuizExerciseDto extends BaseExerciseDto, ListeningQuizPayload {
	type: typeof EXERCISE_TYPE.LISTENING_QUIZ
}

/** 7) PRONUNCIATION PRACTICE */
export interface PronunciationExerciseDto extends BaseExerciseDto, PronunciationPayload {
	type: typeof EXERCISE_TYPE.PRONUNCIATION
}

/** 8) PICTURE DESCRIPTION */
export interface PictureDescriptionExerciseDto extends BaseExerciseDto, PictureDescriptionPayload {
	type: typeof EXERCISE_TYPE.PICTURE_DESCRIPTION
}

/** Union of all possible exercises returned to the frontend */
export type ExerciseDto =
	| FlashcardExerciseDto
	| ClozeExerciseDto
	| SentenceReorderExerciseDto
	| MultipleChoiceExerciseDto
	| DictationExerciseDto
	| ListeningQuizExerciseDto
	| PronunciationExerciseDto
	| PictureDescriptionExerciseDto
