// src/modules/auth/learner/dtos/learner-auth.dtos.ts

import { ApiProperty } from '@nestjs/swagger'
import { IsString, Matches, Length, IsEnum, IsArray, IsNotEmpty, IsOptional } from 'class-validator'
import {
	NATIVE_LANGUAGE,
	INTEREST,
	LEVEL_CODE,
	DEVICE_PLATFORM,
	PUSH_PROVIDER,
} from '@prisma/client'

/**
 * Step 1: Request a one-time code
 */
export class RequestLearnerOtpDto {
	@ApiProperty({ description: 'Phone in E.164 format' })
	@IsString()
	@Matches(/^\+\d{6,15}$/, { message: 'Must be E.164 format' })
	phoneNumber: string
}

/**
 * Step 2: Verify the code
 */
export class VerifyLearnerOtpDto {
	@ApiProperty({ description: 'Phone used in request' })
	@IsString()
	@Matches(/^\+\d{6,15}$/, { message: 'Must be E.164 format' })
	phoneNumber: string

	@ApiProperty({ description: '4-digit one-time code' })
	@IsString()
	@Length(4, 4)
	@Matches(/^\d+$/, { message: 'Numeric only' })
	code: string

	// Optional: register device on authorization
	@ApiProperty({ required: false, description: 'Push device token from client (e.g. Expo token)' })
	@IsOptional()
	@IsString()
	deviceToken?: string

	@ApiProperty({ required: false, enum: DEVICE_PLATFORM, description: 'Device platform' })
	@IsOptional()
	@IsEnum(DEVICE_PLATFORM)
	devicePlatform?: DEVICE_PLATFORM

	@ApiProperty({ required: false, enum: PUSH_PROVIDER, description: 'Push notifications provider' })
	@IsOptional()
	@IsEnum(PUSH_PROVIDER)
	pushProvider?: PUSH_PROVIDER

	@ApiProperty({ required: false, description: 'Preferred device locale (e.g. en-US, ru-RU)' })
	@IsOptional()
	@IsString()
	deviceLocale?: string

	@ApiProperty({ required: false, description: 'Device timezone (IANA or offset)' })
	@IsOptional()
	@IsString()
	deviceTimezone?: string
}

/**
 * Step 3: Complete profile (onboarding)
 */
export class CompleteProfileDto {
	@ApiProperty({ description: 'Full name' })
	@IsString()
	@IsNotEmpty()
	name: string

	@ApiProperty({ enum: NATIVE_LANGUAGE, description: 'Native language' })
	@IsEnum(NATIVE_LANGUAGE)
	nativeLanguage: NATIVE_LANGUAGE

	@ApiProperty({
		isArray: true,
		enum: INTEREST,
		description: 'Areas of interest',
	})
	@IsArray()
	@IsEnum(INTEREST, { each: true })
	interests: INTEREST[]

	@ApiProperty({ description: 'Daily time goal in minutes', default: 15 })
	@IsNotEmpty()
	dailyTimeGoal: number
}

/**
 * “Me” response
 */
export class LearnerDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	name: string

	@ApiProperty()
	phoneNumber: string

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	nativeLanguage: NATIVE_LANGUAGE

	@ApiProperty({ isArray: true, enum: INTEREST })
	interests: INTEREST[]

	@ApiProperty()
	verified: boolean

	@ApiProperty({ description: 'Assigned proficiency level ID' })
	assignedLevelId: number

	@ApiProperty({ enum: LEVEL_CODE, description: 'Assigned proficiency level code' })
	assignedLevelCode: LEVEL_CODE

	@ApiProperty({ description: 'Daily time goal in minutes' })
	dailyTimeGoal: number

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}

export class SuccessVerifyOtpResponse {
	@ApiProperty({ description: 'Success status' })
	success: boolean

	@ApiProperty({ description: 'Expiration time in seconds' })
	expiresIn: number

	@ApiProperty({ description: 'Is this a new user?' })
	isNew: boolean
}
