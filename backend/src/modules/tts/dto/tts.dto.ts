import { IsOptional, IsString, MaxLength } from 'class-validator'

export class TtsRequestDto {
	@IsString()
	@MaxLength(10000)
	text!: string

	@IsString()
	@IsOptional()
	voice?: string
}

export interface TtsResponseDto {
	key: string
	url: string
	bytes: number
}
