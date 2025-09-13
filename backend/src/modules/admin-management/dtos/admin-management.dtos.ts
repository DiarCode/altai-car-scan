import { IsEnum, IsOptional, IsString, Matches } from 'class-validator'
import { ADMIN_ROLE } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'

export class CreateAdminDto {
	@ApiProperty()
	@IsString()
	@Matches(/^\+\d{6,15}$/, {
		message: 'phone_number must be in E.164 format',
	})
	phoneNumber!: string

	@ApiProperty()
	@IsEnum(ADMIN_ROLE)
	role!: ADMIN_ROLE

	@ApiProperty()
	@IsString()
	name: string
}

export class UpdateAdminDto {
	@ApiProperty()
	@IsOptional()
	@Matches(/^\+\d{6,15}$/, {
		message: 'phone_number must be in E.164 format',
	})
	phoneNumber?: string

	@ApiProperty()
	@IsOptional()
	@IsEnum(ADMIN_ROLE)
	role?: ADMIN_ROLE

	@ApiProperty()
	@IsOptional()
	@IsString()
	name?: string
}

export class AdminFilter extends PaginationParamsFilter {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsEnum(ADMIN_ROLE)
	role?: ADMIN_ROLE

	@ApiProperty({ required: false })
	@IsOptional()
	search?: string
}

export class AdminDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	phoneNumber!: string

	@ApiProperty()
	role!: ADMIN_ROLE

	@ApiProperty()
	name!: string

	@ApiProperty()
	createdAt!: Date

	@ApiProperty()
	updatedAt!: Date
}
