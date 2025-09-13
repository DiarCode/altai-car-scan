import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional } from 'class-validator'
import { FreeChatSenderType } from '../types/free-chat.types'

export class FreeChatMessageDto {
	@ApiProperty({ description: 'Unique identifier of the message' })
	id: string

	@ApiProperty({ description: 'ID of the free chat session' })
	freeChatId: string

	@ApiProperty({ description: 'Content of the message' })
	content: string

	@ApiProperty({ enum: FreeChatSenderType, description: 'Role of the message (SYSTEM or USER)' })
	role: FreeChatSenderType

	@ApiProperty({ description: 'Timestamp of message creation' })
	createdAt: Date

	@ApiProperty({ description: 'Whether the message is archived' })
	isArchived: boolean
}

export class FreeChatMessagesResponseDto {
	@ApiProperty({ type: [FreeChatMessageDto] })
	messages: FreeChatMessageDto[]

	@ApiProperty({ description: 'If there are more messages available for pagination' })
	hasMore?: boolean

	@ApiProperty({ description: 'Total number of messages' })
	totalCount?: number
}

export class SendFreeChatMessageDto {
	@ApiProperty({ description: 'Content of the message to send' })
	@IsString()
	@IsNotEmpty()
	content: string
}

export class FreeChatMessagesQuery {
	@ApiProperty({ description: 'Page number for pagination', default: 1 })
	@IsOptional()
	page: number = 1

	@ApiProperty({ description: 'Number of messages per page', default: 5 })
	@IsOptional()
	pageSize: number = 5
}
