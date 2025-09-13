// src/modules/chat/schemas/exercise-attempt.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { EXERCISE_TYPE } from '@prisma/client'

export type ExerciseAttemptDocument = ExerciseAttempt & Document

@Schema({ timestamps: true })
export class ExerciseAttempt {
	@Prop({ required: true })
	learnerId: number

	@Prop({ required: true })
	exerciseId: number

	@Prop({ required: true, enum: EXERCISE_TYPE })
	exerciseType: EXERCISE_TYPE

	@Prop({ required: false, type: Object })
	answer: unknown

	@Prop({ required: true })
	isCorrect: boolean

	@Prop({ required: true, min: 0, max: 100 })
	score: number

	@Prop({ required: true, min: 0 })
	timeSpent: number

	@Prop({ required: true, min: 1 })
	attemptNumber: number

	@Prop({ default: 0 })
	hintsUsed: number

	@Prop()
	feedback?: string

	// Pronunciation audio S3 key (e.g. pronunciation/{learnerId}/{exerciseId}/{attemptNumber}.ogg)
	@Prop({ required: false })
	audioKey?: string

	// ASR result (transcript, phonemes, model, confidence)
	@Prop({ required: false, type: Object })
	asrResult?: {
		transcript: string
		phonemes?: string
		model: string
		confidence?: number
	}

	@Prop({ default: Date.now })
	createdAt: Date
}

export const ExerciseAttemptSchema = SchemaFactory.createForClass(ExerciseAttempt)

// Add indexes for better query performance
ExerciseAttemptSchema.index({ learnerId: 1, exerciseId: 1 })
ExerciseAttemptSchema.index({ learnerId: 1, createdAt: -1 })
ExerciseAttemptSchema.index({ exerciseType: 1, score: 1 })
