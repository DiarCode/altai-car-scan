import { ChatContext } from 'src/modules/chat/adapters/chat-llm-adapter.interface'
import { EXERCISE_TYPE, NATIVE_LANGUAGE } from '@prisma/client'
import { ExerciseAnswer, ExerciseValidationResult } from 'src/modules/chat/types/chat-flow.types'

export interface MultipleChoiceOptionShape {
	answer: string
	isCorrect?: boolean
	correct?: boolean
}

export interface ListeningOptionShape {
	answer: string
	correct: boolean
}

export interface ValidationStrategy<P = any, A extends ExerciseAnswer = ExerciseAnswer> {
	validate(payload: P, answer: A, helpers: StrategyHelpers): Promise<ExerciseValidationResult>
}

export interface StrategyHelpers {
	buildLLMContext(extra: Partial<ChatContext>): ChatContext
	callLLM(prompt: string, context: ChatContext): Promise<string>
	language: NATIVE_LANGUAGE
	getLatestAttemptASR?: () => Promise<{ transcript?: string; confidence?: number } | null>
}

export type ExerciseTypeEnum = EXERCISE_TYPE
