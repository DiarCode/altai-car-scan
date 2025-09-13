import { ApiProperty } from '@nestjs/swagger'
import { NATIVE_LANGUAGE } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ExercisePayload } from 'src/modules/exercises/dtos/exercises.dtos'

// Base DTOs
export class BaseTranslationDto {
	@ApiProperty()
	id: number

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	language: NATIVE_LANGUAGE

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}

// Segment Translations
export class SegmentTranslationDto extends BaseTranslationDto {
	@ApiProperty()
	segmentId: number

	@ApiProperty()
	title: string

	@ApiProperty()
	theoryContent: string
}

export class CreateSegmentTranslationDto {
	@ApiProperty()
	@IsInt()
	segmentId: number

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	language: NATIVE_LANGUAGE

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	theoryContent?: string
}

export class UpdateSegmentTranslationDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	theoryContent?: string
}

// Interest Segment Translations
export class InterestSegmentTranslationDto extends BaseTranslationDto {
	@ApiProperty()
	interestSegmentId: number

	@ApiProperty()
	theoryContent: string
}

export class CreateInterestSegmentTranslationDto {
	@ApiProperty()
	@IsInt()
	interestSegmentId: number

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	language: NATIVE_LANGUAGE

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	theoryContent?: string
}

export class UpdateInterestSegmentTranslationDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	theoryContent: string
}

// Exercise Translations
export class ExerciseTranslationDto extends BaseTranslationDto {
	@ApiProperty()
	exerciseId: number

	@ApiProperty()
	title: string

	@ApiProperty()
	payload: ExercisePayload
}

export class CreateExerciseTranslationDto {
	@ApiProperty()
	@IsInt()
	exerciseId: number

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	language: NATIVE_LANGUAGE

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string

	@ApiProperty({ required: false })
	@IsOptional()
	payload?: ExercisePayload
}

export class UpdateExerciseTranslationDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string

	@ApiProperty({ required: false })
	@IsOptional()
	payload?: ExercisePayload
}

// Bulk operations
export class GenerateTranslationsDto {
	@ApiProperty({ enum: NATIVE_LANGUAGE, isArray: true })
	@IsEnum(NATIVE_LANGUAGE, { each: true })
	languages: NATIVE_LANGUAGE[]
}

// Filter DTOs
export class TranslationFilter {
	@ApiProperty({ enum: NATIVE_LANGUAGE, required: false })
	@IsOptional()
	@IsEnum(NATIVE_LANGUAGE)
	language?: NATIVE_LANGUAGE
}

// Response DTOs with translations
export class SegmentWithTranslationsDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	title: string

	@ApiProperty()
	theoryContent: string

	@ApiProperty()
	order: number

	@ApiProperty()
	timeToComplete: number

	@ApiProperty()
	status: string

	@ApiProperty({ type: [SegmentTranslationDto] })
	@Type(() => SegmentTranslationDto)
	translations: SegmentTranslationDto[]
}

export class InterestSegmentWithTranslationsDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	segmentId: number

	@ApiProperty()
	theoryContent: string

	@ApiProperty()
	interest: string

	@ApiProperty({ type: [InterestSegmentTranslationDto] })
	@Type(() => InterestSegmentTranslationDto)
	translations: InterestSegmentTranslationDto[]
}

export class ExerciseWithTranslationsDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	title: string

	@ApiProperty()
	interestSegmentId: number

	@ApiProperty()
	type: string

	@ApiProperty()
	status: string

	@ApiProperty()
	payload: ExercisePayload

	@ApiProperty({ type: [ExerciseTranslationDto] })
	@Type(() => ExerciseTranslationDto)
	translations: ExerciseTranslationDto[]
}

// Assessment Question Translations
// Assessment Answer Translations
export class AssessmentAnswerTranslationDto extends BaseTranslationDto {
	@ApiProperty()
	answerId: number

	@ApiProperty()
	answer: string
}

export class UpdateAssessmentAnswerTranslationDto {
	@ApiProperty()
	@IsInt()
	answerId: number

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	answer: string
}

export class AssessmentQuestionTranslationDto extends BaseTranslationDto {
	@ApiProperty()
	questionId: number

	@ApiProperty()
	question: string

	@ApiProperty({ type: [AssessmentAnswerTranslationDto] })
	@Type(() => AssessmentAnswerTranslationDto)
	answerTranslations: AssessmentAnswerTranslationDto[]
}

export class CreateAssessmentQuestionTranslationDto {
	@ApiProperty()
	@IsInt()
	questionId: number

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	language: NATIVE_LANGUAGE
}

export class UpdateAssessmentQuestionTranslationDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	question?: string

	@ApiProperty({ required: false, type: [UpdateAssessmentAnswerTranslationDto] })
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => UpdateAssessmentAnswerTranslationDto)
	answerTranslations?: UpdateAssessmentAnswerTranslationDto[]
}

// Response DTOs
export class AssessmentAnswerWithTranslationsDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	questionId: number

	@ApiProperty()
	answer: string

	@ApiProperty()
	isCorrect: boolean

	@ApiProperty({ type: [AssessmentAnswerTranslationDto] })
	@Type(() => AssessmentAnswerTranslationDto)
	translations: AssessmentAnswerTranslationDto[]
}

export class AssessmentQuestionWithTranslationsDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	proficiencyLevelId: number

	@ApiProperty()
	question: string

	@ApiProperty({ required: false })
	imageKey?: string

	@ApiProperty({ type: [AssessmentAnswerWithTranslationsDto] })
	@Type(() => AssessmentAnswerWithTranslationsDto)
	answers: AssessmentAnswerWithTranslationsDto[]

	@ApiProperty({ type: [AssessmentQuestionTranslationDto] })
	@Type(() => AssessmentQuestionTranslationDto)
	translations: AssessmentQuestionTranslationDto[]
}
