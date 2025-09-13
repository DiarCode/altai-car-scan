// src/modules/chat/types/chat-flow.types.ts

import { NATIVE_LANGUAGE, INTEREST, EXERCISE_TYPE } from '@prisma/client'

export interface LearnerPreferences {
	language: NATIVE_LANGUAGE
	interests: INTEREST[]
}

export enum ChatFlowState {
	MODULE_WELCOME = 'MODULE_WELCOME',
	SEGMENT_CONTENT = 'SEGMENT_CONTENT',
	EXERCISE = 'EXERCISE',
	MODULE_COMPLETE = 'MODULE_COMPLETE',

	// For general chat outside of a learning flow
	FREE_CONVERSATION = 'FREE_CONVERSATION',
}

export enum ChatSessionStatus {
	ACTIVE = 'ACTIVE',
	PAUSED = 'PAUSED',
	COMPLETED = 'COMPLETED',
	ABANDONED = 'ABANDONED',
}

export enum ChatContextScope {
	CURRENT_EXERCISE = 'CURRENT_EXERCISE',
	CURRENT_SEGMENT = 'CURRENT_SEGMENT',
	CURRENT_MODULE = 'CURRENT_MODULE',
	KAZAKH_LANGUAGE = 'KAZAKH_LANGUAGE',
	GENERAL_LEARNING = 'GENERAL_LEARNING',
}

export enum UserCommandType {
	EXPLAIN = 'EXPLAIN',
	MEMORIZE = 'MEMORIZE',
	HELP = 'HELP',
	REPEAT = 'REPEAT',
	TRANSLATE = 'TRANSLATE',
	GRAMMAR = 'GRAMMAR',
	PRONUNCIATION = 'PRONUNCIATION',
}

export enum MessagePriority {
	LOW = 'LOW',
	NORMAL = 'NORMAL',
	HIGH = 'HIGH',
	URGENT = 'URGENT',
}

export enum ChatSessionType {
	LEARNING_FLOW = 'LEARNING_FLOW',
	FREE_CHAT = 'FREE_CHAT',
	HELP_SESSION = 'HELP_SESSION',
}

export enum ChatActionType {
	BEGIN_MODULE = 'BEGIN_MODULE',
	NEXT_SEGMENT = 'NEXT_SEGMENT',
	START_EXERCISE = 'START_EXERCISE',
	SUBMIT_ANSWER = 'SUBMIT_ANSWER',
	ASK_QUESTION = 'ASK_QUESTION',
	USE_COMMAND = 'USE_COMMAND',
}

export interface LearningProgress {
	moduleId: number
	segmentIds: number[]
	currentSegmentId?: number
	currentInterestSegmentId?: number
	currentExerciseId?: number
	currentSegmentIndex: number
	exercisesCompleted: number
	exercisesPerSegment: number
	selectedInterest?: INTEREST // Made optional as it will be set dynamically
	interestIndex?: number // Added for module-level interest rotation
	completedSegmentIds: number[]
	completedExerciseIds: number[]
	lastActivityAt: Date
}

export interface ExerciseAttempt {
	exerciseId: number
	exerciseType: EXERCISE_TYPE
	// Union of all supported answer shapes across exercise types
	answer: ExerciseAnswer
	isCorrect: boolean
	score: number
	timeSpent: number
	attemptNumber: number
	hintsUsed: number
}

// Answer union covering all current exercise answer possibilities.
// FLASHCARD: null (no answer needed / passive review)
// CLOZE: string[] (each blank answer)
// SENTENCE_REORDER: string[] (ordered fragments)
// MULTIPLE_CHOICE: number[] (index per question)
// DICTATION: string (transcribed text)
// LISTENING_QUIZ: number[] (index per question)
// PRONUNCIATION (stub): { confidence?: number; audioUrl?: string; transcript?: string }
// PICTURE_DESCRIPTION: string (free-form description)
export type ExerciseAnswer =
	| null
	| string
	| string[]
	| number[]
	| { confidence?: number; audioUrl?: string; transcript?: string }

export enum VocabularySource {
	MODULE = 'MODULE',
	LLM = 'LLM',
}

export interface VocabularyItem {
	word: string
	definition: string
	examples: string[]
	source: VocabularySource
	moduleId?: number
}

export enum MessageRole {
	USER = 'user',
	ASSISTANT = 'assistant',
	SYSTEM = 'system',
}

// Enhanced message types
export enum ChatMessageType {
	// System messages
	SYSTEM_INTRODUCTION = 'SYSTEM_INTRODUCTION',
	SYSTEM_MODULE_INFO = 'SYSTEM_MODULE_INFO',
	SYSTEM_SEGMENT_CONTENT = 'SYSTEM_SEGMENT_CONTENT',
	SYSTEM_EXERCISE_PROMPT = 'SYSTEM_EXERCISE_PROMPT',
	SYSTEM_EXERCISE_RESULT = 'SYSTEM_EXERCISE_RESULT',
	SYSTEM_PROGRESS_UPDATE = 'SYSTEM_PROGRESS_UPDATE',
	SYSTEM_STATE_CHANGE = 'SYSTEM_STATE_CHANGE',
	SYSTEM_INTERVENTION_PROMPT = 'SYSTEM_INTERVENTION_PROMPT',

	// User messages
	USER_ACTION = 'USER_ACTION',
	USER_QUESTION = 'USER_QUESTION',
	USER_EXERCISE_ANSWER = 'USER_EXERCISE_ANSWER',
	USER_VOCABULARY_REQUEST = 'USER_VOCABULARY_REQUEST',

	// AI responses
	AI_RESPONSE = 'AI_RESPONSE',
	AI_VOCABULARY_EXPLANATION = 'AI_VOCABULARY_EXPLANATION',
	AI_MEMORIZATION_TIP = 'AI_MEMORIZATION_TIP',
}

export interface ChatFlowContext {
	sessionId: string
	learnerId: number
	moduleId: number
	flowState: ChatFlowState
	progress: LearningProgress
	activeContent?: ChatActiveContent
	preferences: LearnerPreferences
}

export interface ChatActiveContent {
	segmentId?: number
	interestSegmentId?: number
	exerciseId?: number
	content?: any // This can be segment, exercise, or vocabulary content
}

export interface ExerciseValidationResult {
	isCorrect: boolean
	score: number
	feedback: string
	detailedFeedback?: ExerciseDetailedFeedback
}

export interface ExerciseDetailedFeedback {
	correctAnswer?: unknown
	explanation?: string
	hints?: string[]
}
