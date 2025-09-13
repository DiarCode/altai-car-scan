import { ApiProperty } from '@nestjs/swagger'
import { ADMIN_ROLE } from '@prisma/client'
import { IsString, IsNotEmpty, Matches, Length } from 'class-validator'

export class RequestAdminOtpDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Matches(/^\+\d{6,15}$/, {
		message: 'phoneNumber must be in E.164 format (e.g. +1234567890)',
	})
	phoneNumber: string
}

export class VerifyAdminOtpDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Matches(/^\+\d{6,15}$/, {
		message: 'phoneNumber must be in E.164 format (e.g. +1234567890)',
	})
	phoneNumber: string

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Length(4, 4, {
		message: 'otpCode must be exactly 4 characters',
	})
	@Matches(/^\d+$/, { message: 'otpCode must contain only digits' })
	otpCode: string
}

export class AdminDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	name: string

	@ApiProperty()
	phoneNumber: string

	@ApiProperty()
	role: ADMIN_ROLE

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}
