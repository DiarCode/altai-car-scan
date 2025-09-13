// src/modules/chat/dtos/chat.dtos.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsBoolean,
	ValidateNested,
	Min,
	Max,
} from 'class-validator'
import { NATIVE_LANGUAGE, INTEREST } from '@prisma/client'
import {
	ChatMessageType,
	MessagePriority,
	ChatSessionType,
	ChatSessionStatus,
	ChatFlowState,
	ChatActionType,
} from '../types/chat-flow.types'
import {
	ContentReference,
	ExerciseReference,
	UserAnswer,
	CommandData,
	AiMetadata,
	LearningContext,
	SessionStats,
	ChatResponseContext,
} from '../types/chat.types'
import { BaseModuleDto, ModuleSummaryDto } from 'src/modules/modules/dtos/modules.dtos'

// Base DTOs
export class ChatMessageDto {
	@ApiProperty()
	_id: string

	@ApiProperty()
	sessionId: string

	@ApiProperty()
	learnerId: number

	@ApiProperty()
	moduleId: number

	@ApiProperty({ enum: ChatMessageType })
	type: ChatMessageType

	@ApiProperty()
	content: string

	@ApiProperty({ enum: NATIVE_LANGUAGE })
	language?: NATIVE_LANGUAGE

	@ApiProperty({ enum: MessagePriority })
	priority: MessagePriority

	@ApiProperty({ type: () => ContentReference })
	contentReference?: ContentReference

	@ApiProperty({ type: () => ExerciseReference })
	exerciseReference?: ExerciseReference

	@ApiProperty({ type: () => UserAnswer })
	userAnswer?: UserAnswer

	@ApiProperty({ type: () => CommandData })
	commandData?: CommandData

	@ApiProperty({ type: () => AiMetadata })
	aiMetadata?: AiMetadata

	@ApiProperty()
	isSystemMessage: boolean

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	parentMessageId?: string
}

export class SessionPreferencesDto {
	@ApiPropertyOptional({ enum: NATIVE_LANGUAGE })
	@IsEnum(NATIVE_LANGUAGE)
	preferredLanguage: NATIVE_LANGUAGE

	@ApiPropertyOptional({ enum: INTEREST })
	@IsEnum(INTEREST)
	interest: INTEREST
}

// Request DTOs
export class CreateChatSessionDto {
	@ApiProperty()
	@IsInt()
	@Min(1)
	moduleId: number

	@ApiProperty({ type: () => BaseModuleDto })
	@ValidateNested()
	@Type(() => BaseModuleDto)
	module: BaseModuleDto

	@ApiProperty({ enum: ChatSessionType })
	@IsEnum(ChatSessionType)
	type: ChatSessionType

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	segmentId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	interestSegmentId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	exerciseId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@ValidateNested()
	@Type(() => SessionPreferencesDto)
	preferences?: SessionPreferencesDto
}

export class SendChatMessageDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	text: string

	@ApiPropertyOptional({ enum: ChatMessageType })
	@IsOptional()
	@IsEnum(ChatMessageType)
	type?: ChatMessageType = ChatMessageType.USER_QUESTION

	@ApiPropertyOptional({ enum: MessagePriority })
	@IsOptional()
	@IsEnum(MessagePriority)
	priority?: MessagePriority = MessagePriority.NORMAL
}

export class SendCommandDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	context?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	text?: string
}

export class SubmitExerciseAnswerDto {
	@ApiProperty()
	@IsInt()
	@Min(1)
	exerciseId: number

	@ApiPropertyOptional()
	@IsOptional()
	answer?: unknown

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isDontKnow?: boolean
}

export class UpdateSessionDto {
	@ApiPropertyOptional({ enum: ChatSessionStatus })
	@IsOptional()
	@IsEnum(ChatSessionStatus)
	status?: ChatSessionStatus

	@ApiPropertyOptional({ enum: ChatFlowState })
	@IsOptional()
	@IsEnum(ChatFlowState)
	state?: ChatFlowState

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	lastMessageId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	segmentId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	interestSegmentId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	exerciseId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(0)
	segmentIndex?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(0)
	exerciseIndex?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	isExerciseActive?: boolean

	@ApiPropertyOptional()
	@IsOptional()
	@ValidateNested()
	@Type(() => SessionPreferencesDto)
	preferences?: SessionPreferencesDto

	@ApiPropertyOptional()
	@IsOptional()
	@ValidateNested()
	@Type(() => LearningContextDto)
	learningContext?: LearningContext
}

export class LearningContextDto implements LearningContext {
	@ApiProperty()
	moduleId: number

	@ApiProperty({ type: () => BaseModuleDto })
	@Type(() => BaseModuleDto)
	module: BaseModuleDto

	@ApiProperty({ type: [Number] })
	segmentIds: number[]

	@ApiPropertyOptional()
	currentSegmentId?: number

	@ApiPropertyOptional()
	currentInterestSegmentId?: number

	@ApiPropertyOptional()
	currentExerciseId?: number

	@ApiProperty()
	currentSegmentIndex: number

	@ApiProperty()
	exercisesCompleted: number

	@ApiProperty()
	exercisesPerSegment: number

	@ApiProperty({ type: [Number] })
	completedSegmentIds: number[]

	@ApiProperty({ type: [Number] })
	completedExerciseIds: number[]

	@ApiProperty()
	lastActivityAt: Date

	@ApiPropertyOptional()
	interestIndex?: number

	@ApiPropertyOptional({ enum: INTEREST })
	selectedInterest?: INTEREST

	@ApiPropertyOptional()
	nextModuleId?: number
}

// Query DTOs
export class ChatMessagesQueryDto {
	@ApiProperty()
	@IsOptional()
	@IsString()
	sessionId?: string

	@ApiProperty()
	@IsOptional()
	@IsInt()
	learnerId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	moduleId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number = 1

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(50)
	pageSize?: number = 5

	@ApiPropertyOptional({ enum: ChatMessageType })
	@IsOptional()
	@IsEnum(ChatMessageType)
	type?: ChatMessageType
}

export class ChatSessionsQueryDto {
	@ApiProperty()
	@IsInt()
	learnerId: number

	@ApiPropertyOptional({ enum: ChatSessionStatus })
	@IsOptional()
	@IsEnum(ChatSessionStatus)
	status?: ChatSessionStatus

	@ApiPropertyOptional({ enum: ChatSessionType })
	@IsOptional()
	@IsEnum(ChatSessionType)
	type?: ChatSessionType

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	moduleId?: number

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10

	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(0)
	offset?: number = 0
}

// Response DTOs
export class ChatSessionDto {
	@ApiProperty()
	sessionId: string

	@ApiProperty()
	learnerId: number

	@ApiProperty({ enum: ChatSessionType })
	type: ChatSessionType

	@ApiProperty({ enum: ChatSessionStatus })
	status: ChatSessionStatus

	@ApiProperty({ enum: ChatFlowState })
	state: ChatFlowState

	@ApiProperty({ type: () => LearningContextDto })
	@Type(() => LearningContextDto)
	learningContext: LearningContext

	@ApiProperty({ type: () => SessionStats })
	stats: SessionStats

	@ApiProperty({ type: () => SessionPreferencesDto })
	preferences: SessionPreferencesDto

	@ApiProperty()
	lastMessageId?: string

	@ApiProperty()
	startedAt: Date

	@ApiProperty()
	endedAt?: Date

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}

export class ChatMessagesResponseDto {
	@ApiProperty({ type: [ChatMessageDto] })
	messages: ChatMessageDto[]

	@ApiProperty()
	hasMore: boolean

	@ApiProperty()
	totalCount: number
}

export class ChatSessionsResponseDto {
	@ApiProperty({ type: [ChatSessionDto] })
	sessions: ChatSessionDto[]

	@ApiProperty()
	total: number

	@ApiProperty()
	hasMore: boolean
}

export class ChatResponseDto {
	@ApiProperty()
	message: ChatMessageDto

	@ApiProperty()
	session: ChatSessionDto

	@ApiProperty({ type: () => ChatResponseContext })
	context: ChatResponseContext

	@ApiProperty({ enum: ChatActionType, isArray: true })
	allowedActions: ChatActionType[]
}

export class ModuleDto extends ModuleSummaryDto {
	isCompleted: boolean
}
