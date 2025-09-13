import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { FreeChatSenderType } from '../types/free-chat.types'

export type FreeChatDocument = FreeChat & Document
export type FreeChatMessageDocument = FreeChatMessage & Document

@Schema({ timestamps: true })
export class FreeChat {
	@Prop({ required: true })
	learnerId: number

	@Prop({ default: Date.now })
	createdAt: Date

	@Prop({ default: Date.now })
	updatedAt: Date
}

export const FreeChatSchema = SchemaFactory.createForClass(FreeChat)

@Schema({ timestamps: true })
export class FreeChatMessage {
	@Prop({ required: true })
	freeChatId: string

	@Prop({ required: true })
	content: string

	@Prop({ required: true, enum: FreeChatSenderType })
	role: FreeChatSenderType

	@Prop({ default: false })
	isArchived: boolean

	@Prop({ default: Date.now })
	createdAt: Date

	@Prop({ default: Date.now })
	updatedAt: Date
}

export const FreeChatMessageSchema = SchemaFactory.createForClass(FreeChatMessage)
