// src/modules/chat/schemas/chat-message.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { NATIVE_LANGUAGE, EXERCISE_TYPE } from '@prisma/client'
import {
	ChatMessageType,
	ChatContextScope,
	UserCommandType,
	MessagePriority,
} from '../types/chat-flow.types'
import { MessageReferenceType } from '../types/chat.types'

export type ChatMessageDocument = ChatMessage & Document

@Schema({ _id: false })
export class MessageReference {
	@Prop({ required: true })
	id: number

	@Prop({ required: true })
	type: MessageReferenceType
}
export const MessageReferenceSchema = SchemaFactory.createForClass(MessageReference)

@Schema({ _id: false })
export class ExerciseReference {
	@Prop({ required: true })
	exerciseId: number

	@Prop({ required: true, enum: EXERCISE_TYPE })
	exerciseType: EXERCISE_TYPE

	@Prop()
	interestSegmentId?: number
}
export const ExerciseReferenceSchema = SchemaFactory.createForClass(ExerciseReference)

@Schema({ _id: false })
export class UserAnswer {
	@Prop({ required: true })
	exerciseId: number

	@Prop({ required: false, type: Object })
	answer?: any

	@Prop({ required: true })
	isCorrect: boolean

	@Prop({ type: Number, min: 0, max: 100 })
	score?: number

	@Prop()
	feedback?: string

	@Prop({ default: Date.now })
	submittedAt: Date
}
export const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer)

@Schema({ _id: false })
export class CommandData {
	@Prop({ required: true, enum: UserCommandType })
	command: UserCommandType

	@Prop()
	context?: string

	@Prop()
	targetText?: string // Text user wants to explain/memorize

	@Prop()
	response?: string // AI response to the command
}
export const CommandDataSchema = SchemaFactory.createForClass(CommandData)

@Schema({ _id: false })
export class AIResponseMetadata {
	@Prop()
	model?: string

	@Prop()
	tokensUsed?: number

	@Prop()
	responseTime?: number

	@Prop()
	confidence?: number

	@Prop({ type: [String] })
	sources?: string[] // RAG sources used

	@Prop({ enum: ChatContextScope })
	contextScope?: ChatContextScope
}
export const AIResponseMetadataSchema = SchemaFactory.createForClass(AIResponseMetadata)

@Schema({ timestamps: true })
export class ChatMessage {
	@Prop({ required: true })
	sessionId: string

	@Prop({ required: true })
	learnerId: number

	@Prop({ required: true })
	moduleId: number

	@Prop({ required: true, enum: ChatMessageType })
	type: ChatMessageType

	@Prop({ required: true })
	content: string

	@Prop({ enum: NATIVE_LANGUAGE })
	language?: NATIVE_LANGUAGE

	@Prop({ enum: MessagePriority, default: MessagePriority.NORMAL })
	priority: MessagePriority

	@Prop({ type: MessageReferenceSchema })
	contentReference?: MessageReference

	@Prop({ type: ExerciseReferenceSchema })
	exerciseReference?: ExerciseReference

	@Prop({ type: UserAnswerSchema })
	userAnswer?: UserAnswer

	@Prop({ type: CommandDataSchema })
	commandData?: CommandData

	@Prop({ type: AIResponseMetadataSchema })
	aiMetadata?: AIResponseMetadata

	@Prop({ default: false })
	isSystemMessage: boolean

	@Prop({ default: Date.now })
	createdAt: Date

	@Prop({ default: Date.now })
	updatedAt: Date
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage)
