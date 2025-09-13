// src/modules/chat/schemas/chat-session.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { ChatSessionStatus, ChatSessionType, ChatFlowState } from '../types/chat-flow.types'
import { LearningContext, SessionStats, SessionPreferences } from '../types/chat.types'

export type ChatSessionDocument = ChatSession & Document

@Schema({ timestamps: true })
export class ChatSession {
	@Prop({ required: true, unique: true })
	sessionId: string

	@Prop({ required: true })
	learnerId: number

	@Prop({ required: true, enum: ChatSessionType })
	type: ChatSessionType

	@Prop({ required: true, enum: ChatSessionStatus })
	status: ChatSessionStatus

	@Prop({ required: true, enum: ChatFlowState, default: ChatFlowState.FREE_CONVERSATION })
	state: ChatFlowState

	@Prop({
		type: {
			moduleId: { type: Number, required: true },
			module: {
				id: { type: Number, required: true },
				title: { type: String, required: true },
				theoryContent: { type: String, required: true },
				outcomes: { type: String, required: true },
				description: { type: String, required: true },
				order: { type: Number, required: true },
				status: { type: String, required: true },
				level: {
					id: { type: Number, required: true },
					code: { type: String, required: true },
					title: { type: String, required: true },
					description: { type: String, required: true },
				},
			},
			nextModuleId: { type: Number }, // Optional next module ID for learning flow
			segmentIds: [{ type: Number }],
			currentSegmentId: { type: Number },
			currentInterestSegmentId: { type: Number },
			currentExerciseId: { type: Number },
			currentSegmentIndex: { type: Number, required: true },
			exercisesCompleted: { type: Number, required: true },
			exercisesPerSegment: { type: Number, required: true },
			completedSegmentIds: [{ type: Number }],
			completedExerciseIds: [{ type: Number }],
			lastActivityAt: { type: Date, required: true },
			interestIndex: { type: Number },
			selectedInterest: { type: String },
		},
		required: true,
	})
	learningContext: LearningContext

	@Prop({ type: SessionStats })
	stats: SessionStats

	@Prop({ type: SessionPreferences })
	preferences: SessionPreferences

	@Prop()
	lastMessageId?: string

	@Prop({ default: Date.now })
	startedAt: Date

	@Prop()
	endedAt?: Date

	@Prop({ default: Date.now })
	createdAt: Date

	@Prop({ default: Date.now })
	updatedAt: Date

	@Prop({
		type: [
			{
				summary: { type: String, required: true },
				fromMessageCreatedAt: { type: Date, required: true },
				toMessageCreatedAt: { type: Date, required: true },
				createdAt: { type: Date, default: Date.now },
			},
		],
		default: [],
	})
	conversationSummaries: Array<{
		summary: string
		fromMessageCreatedAt: Date
		toMessageCreatedAt: Date
		createdAt: Date
	}>
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession)
