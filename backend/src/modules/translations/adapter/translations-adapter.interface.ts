import { NATIVE_LANGUAGE } from '@prisma/client'
import {
	SegmentTranslationResult,
	InterestSegmentTranslationResult,
	ExerciseTranslationResult,
	AssessmentQuestionTranslationResult,
	ModuleVocabularyTranslationResult,
} from './translations-adapter.types'

export interface TranslationsAdapter {
	/**
	 * Translate a segment's title and theory content
	 */
	translateSegment(
		segmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<SegmentTranslationResult>

	/**
	 * Translate an interest segment's theory content
	 */
	translateInterestSegment(
		interestSegmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<InterestSegmentTranslationResult>

	/**
	 * Translate an exercise's title and payload
	 */
	translateExercise(
		exerciseId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<ExerciseTranslationResult>

	/**
	 * Translate an assessment question with its answers
	 */
	translateAssessmentQuestion(
		questionId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<AssessmentQuestionTranslationResult>

	/**
	 * Translate a module vocabulary's translations and descriptions
	 */
	translateModuleVocabulary(
		vocabularyId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<ModuleVocabularyTranslationResult>
}
