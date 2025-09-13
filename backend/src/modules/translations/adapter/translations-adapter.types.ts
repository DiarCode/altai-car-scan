import { NATIVE_LANGUAGE } from '@prisma/client'
import { ExercisePayload } from 'src/modules/exercises/dtos/exercises.dtos'

export interface SegmentTranslationResult {
	title: string
	theoryContent: string
}

export interface InterestSegmentTranslationResult {
	theoryContent: string
}

export interface ExerciseTranslationResult {
	title: string
	payload: ExercisePayload
}

export interface TranslationRequest {
	sourceLanguage: NATIVE_LANGUAGE
	targetLanguage: NATIVE_LANGUAGE
}

export interface SegmentTranslationRequest extends TranslationRequest {
	segmentId: number
}

export interface InterestSegmentTranslationRequest extends TranslationRequest {
	interestSegmentId: number
}

export interface ExerciseTranslationRequest extends TranslationRequest {
	exerciseId: number
}

export interface AssessmentQuestionTranslationResult {
	question: string
	answers: AssessmentAnswerTranslationResult[]
}

export interface AssessmentAnswerTranslationResult {
	answer: string
}

export interface ModuleVocabularyTranslationResult {
	translations: { language: NATIVE_LANGUAGE; translation: string }[]
	descriptions: { language: NATIVE_LANGUAGE; description: string }[]
}

export interface ModuleVocabularyTranslationRequest extends TranslationRequest {
	vocabularyId: number
}
