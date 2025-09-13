// src/modules/chat/schemas/learner-progress.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { INTEREST } from '@prisma/client'

export type LearnerProgressDocument = LearnerProgress & Document

@Schema({ timestamps: true })
export class LearnerProgress {
	@Prop({ required: true, unique: true })
	sessionId: string

	@Prop({ required: true })
	learnerId: number

	@Prop({ required: true })
	moduleId: number

	@Prop()
	currentSegmentId?: number

	@Prop()
	currentInterestSegmentId?: number

	@Prop()
	currentExerciseId?: number

	@Prop({ default: 0 })
	segmentIndex: number

	@Prop({ default: 0 })
	exercisesCompleted: number

	@Prop({ default: 1 })
	exercisesPerSegment: number

	@Prop({ required: true, enum: INTEREST })
	selectedInterest: INTEREST

	@Prop({ type: [Number], default: [] })
	completedSegmentIds: number[]

	@Prop({ type: [Number], default: [] })
	completedExerciseIds: number[]

	@Prop({ default: Date.now })
	lastActivityAt: Date
}

export const LearnerProgressSchema = SchemaFactory.createForClass(LearnerProgress)
