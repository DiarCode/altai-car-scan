import { ApiProperty } from '@nestjs/swagger'
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE, Prisma } from '@prisma/client'
import { PaginationParamsFilter } from 'src/common/utils/pagination.util'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

export class BaseNotificationDto {
	@ApiProperty()
	id!: number

	@ApiProperty()
	recipientId!: number

	@ApiProperty({ enum: NOTIFICATION_TYPE })
	type!: NOTIFICATION_TYPE

	@ApiProperty()
	title!: string

	@ApiProperty()
	body!: string

	@ApiProperty({ required: false, nullable: true })
	data!: Prisma.JsonValue | null

	@ApiProperty({ required: false, nullable: true })
	deepLink!: string | null

	@ApiProperty()
	createdAt!: Date

	@ApiProperty({ required: false, nullable: true })
	sentAt!: Date | null

	@ApiProperty({ required: false, nullable: true })
	readAt!: Date | null

	@ApiProperty({ enum: NOTIFICATION_STATUS })
	status!: NOTIFICATION_STATUS
}

export class NotificationsFilter extends PaginationParamsFilter {
	@ApiProperty({ required: false, enum: NOTIFICATION_STATUS })
	@IsOptional()
	@IsEnum(NOTIFICATION_STATUS)
	status?: NOTIFICATION_STATUS

	@ApiProperty({ required: false, enum: NOTIFICATION_TYPE })
	@IsOptional()
	@IsEnum(NOTIFICATION_TYPE)
	type?: NOTIFICATION_TYPE

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	search?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	unreadOnly?: boolean
}

// Base message type for templates and internal use (avoid Pick<...>)
export interface NotificationMessageBase {
	title: string
	body: string
	deepLink?: string
}
