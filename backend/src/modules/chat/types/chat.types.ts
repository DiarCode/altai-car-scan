import { NATIVE_LANGUAGE, INTEREST, EXERCISE_TYPE } from '@prisma/client'
import { UserCommandType, ChatContextScope } from './chat-flow.types'
import { BaseModuleDto } from 'src/modules/modules/dtos/modules.dtos'

export enum MessageReferenceType {
	MODULE = 'MODULE',
	SEGMENT = 'SEGMENT',
	INTEREST_SEGMENT = 'INTEREST_SEGMENT',
	EXERCISE = 'EXERCISE',
}

export class ContentReference {
	id: number
	type: MessageReferenceType
}

export class ExerciseReference {
	exerciseId: number
	exerciseType: EXERCISE_TYPE
	interestSegmentId?: number
}

export class UserAnswer {
	exerciseId: number
	answer?: any
	isCorrect: boolean
	score?: number
	feedback?: string
	submittedAt: Date
}

export class CommandData {
	command: UserCommandType
	context?: string
	text?: string
	response?: string
}

export class AiMetadata {
	model?: string
	tokensUsed?: number
	responseTime?: number
	confidence?: number
	sources?: string[]
	contextScope?: ChatContextScope
}

export class LearningContext {
	moduleId: number
	module: BaseModuleDto
	segmentIds: number[]
	currentSegmentId?: number
	currentInterestSegmentId?: number
	currentExerciseId?: number
	currentSegmentIndex: number
	exercisesCompleted: number
	exercisesPerSegment: number
	completedSegmentIds: number[]
	completedExerciseIds: number[]
	lastActivityAt: Date
	interestIndex?: number
	selectedInterest?: INTEREST
	nextModuleId?: number
}

export class SessionStats {
	totalMessages: number = 0
	userMessages: number = 0
	aiResponses: number = 0
	questionsAsked: number = 0
	exercisesCompleted: number = 0
	totalScore: number = 0
	averageResponseTime: number = 0
	lastActivityAt: Date = new Date()
}

export class SessionPreferences {
	preferredLanguage: NATIVE_LANGUAGE
	interest: INTEREST
}

export class ChatResponseContext {
	scope: ChatContextScope | null
	hasRAGContext: boolean
	responseTime: number
	tokensUsed: number
}
