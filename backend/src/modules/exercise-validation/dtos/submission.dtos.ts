import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsBoolean, IsArray, IsString } from 'class-validator'

export class BaseSubmitDto {
	@ApiProperty()
	@IsInt()
	exerciseId: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isDontKnow?: boolean
}

export class SubmitClozeDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	answer?: string[]
}

export class SubmitMultipleChoiceDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	answer?: number[]
}

export class SubmitSentenceReorderDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	answer?: string[]
}

export class SubmitDictationDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	answer?: string
}

export class SubmitListeningQuizDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	answer?: number[]
}

export class SubmitPictureDescriptionDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	answer?: string
}

export class SubmitFlashcardDto extends BaseSubmitDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	answer?: string
}

// DTOs describing the expected request shapes for each exercise type (shared between chat/dailys)
