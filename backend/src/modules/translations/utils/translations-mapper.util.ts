import {
	SegmentTranslation,
	InterestSegmentTranslation,
	ExerciseTranslation,
	NATIVE_LANGUAGE,
	AssessmentAnswer,
	AssessmentAnswerTranslation,
	AssessmentQuestion,
	AssessmentQuestionTranslation,
} from '@prisma/client'
import {
	SegmentTranslationDto,
	InterestSegmentTranslationDto,
	ExerciseTranslationDto,
	SegmentWithTranslationsDto,
	InterestSegmentWithTranslationsDto,
	ExerciseWithTranslationsDto,
	AssessmentAnswerTranslationDto,
	AssessmentQuestionTranslationDto,
	AssessmentQuestionWithTranslationsDto,
} from '../dtos/translations.dtos'
import { Segment, InterestSegment, Exercise } from '@prisma/client'
import { ExercisePayload } from 'src/modules/exercises/dtos/exercises.dtos'

// Basic mappers for translation entities
export function toSegmentTranslationDto(translation: SegmentTranslation): SegmentTranslationDto {
	return {
		id: translation.id,
		segmentId: translation.segmentId,
		language: translation.language,
		title: translation.title,
		theoryContent: translation.theoryContent,
		createdAt: translation.createdAt,
		updatedAt: translation.updatedAt,
	}
}

export function toInterestSegmentTranslationDto(
	translation: InterestSegmentTranslation,
): InterestSegmentTranslationDto {
	return {
		id: translation.id,
		interestSegmentId: translation.interestSegmentId,
		language: translation.language,
		theoryContent: translation.theoryContent,
		createdAt: translation.createdAt,
		updatedAt: translation.updatedAt,
	}
}

export function toExerciseTranslationDto(translation: ExerciseTranslation): ExerciseTranslationDto {
	return {
		id: translation.id,
		exerciseId: translation.exerciseId,
		language: translation.language,
		title: translation.title,
		payload: translation.payload as unknown as ExercisePayload,
		createdAt: translation.createdAt,
		updatedAt: translation.updatedAt,
	}
}

// Mappers for entities with translations
type SegmentWithTranslations = Segment & {
	SegmentTranslation?: SegmentTranslation[]
}

export function toSegmentWithTranslationsDto(
	segment: SegmentWithTranslations,
): SegmentWithTranslationsDto {
	return {
		id: segment.id,
		title: segment.title,
		theoryContent: segment.theoryContent,
		order: segment.order,
		timeToComplete: segment.timeToComplete,
		status: segment.status,
		translations: segment.SegmentTranslation?.map(toSegmentTranslationDto) || [],
	}
}

type InterestSegmentWithTranslations = InterestSegment & {
	InterestSegmentTranslation?: InterestSegmentTranslation[]
}

export function toInterestSegmentWithTranslationsDto(
	interestSegment: InterestSegmentWithTranslations,
): InterestSegmentWithTranslationsDto {
	return {
		id: interestSegment.id,
		segmentId: interestSegment.segmentId,
		theoryContent: interestSegment.theoryContent,
		interest: interestSegment.interest,
		translations:
			interestSegment.InterestSegmentTranslation?.map(toInterestSegmentTranslationDto) || [],
	}
}

type ExerciseWithTranslations = Exercise & {
	ExerciseTranslation?: ExerciseTranslation[]
}

export function toExerciseWithTranslationsDto(
	exercise: ExerciseWithTranslations,
): ExerciseWithTranslationsDto {
	return {
		id: exercise.id,
		title: exercise.title,
		interestSegmentId: exercise.interestSegmentId,
		type: exercise.type,
		status: exercise.status,
		payload: exercise.payload as unknown as ExercisePayload,
		translations: exercise.ExerciseTranslation?.map(toExerciseTranslationDto) || [],
	}
}

// Helper to apply translation to an entity based on user language
export function applyTranslation<T extends { title?: string; theoryContent?: string }>(
	entity: T,
	translations: Array<{ language: NATIVE_LANGUAGE; title?: string; theoryContent?: string }>,
	userLanguage: NATIVE_LANGUAGE,
): T {
	const translation = translations.find(t => !(t instanceof Error) && t.language === userLanguage)

	if (!translation) {
		return entity
	}

	return {
		...entity,
		...(translation.title && { title: translation.title }),
		...(translation.theoryContent && { theoryContent: translation.theoryContent }),
	}
}

// Helper to apply exercise translation
export function applyExerciseTranslation(
	exercise: Exercise,
	translations: ExerciseTranslation[],
	userLanguage: NATIVE_LANGUAGE,
): Exercise {
	const translation = translations.find(t => t.language === userLanguage)

	if (!translation) {
		return exercise
	}

	return {
		...exercise,
		title: translation.title || exercise.title,
		payload: translation.payload || exercise.payload,
	}
}

// Validation helpers
export function filterTranslationsByLanguage<T extends { language: NATIVE_LANGUAGE }>(
	translations: T[],
	language: NATIVE_LANGUAGE,
): T[] {
	return translations.filter(t => t.language === language)
}

export function getAvailableLanguages<T extends { language: NATIVE_LANGUAGE }>(
	translations: T[],
): NATIVE_LANGUAGE[] {
	return [...new Set(translations.map(t => t.language))]
}

// Helper to check if translation exists
export function hasTranslation<T extends { language: NATIVE_LANGUAGE }>(
	translations: T[],
	language: NATIVE_LANGUAGE,
): boolean {
	return translations.some(t => t.language === language)
}

// Assessment Question and Answer mappers
export function toAssessmentQuestionTranslationDto(
	translation: AssessmentQuestionTranslation,
	answerTranslations: AssessmentAnswerTranslation[] = [],
): AssessmentQuestionTranslationDto {
	return {
		id: translation.id,
		questionId: translation.questionId,
		language: translation.language,
		question: translation.question,
		createdAt: translation.createdAt,
		updatedAt: translation.updatedAt,
		answerTranslations: answerTranslations.map(toAssessmentAnswerTranslationDto),
	}
}

export function toAssessmentAnswerTranslationDto(
	translation: AssessmentAnswerTranslation,
): AssessmentAnswerTranslationDto {
	return {
		id: translation.id,
		answerId: translation.answerId,
		language: translation.language,
		answer: translation.answer,
		createdAt: translation.createdAt,
		updatedAt: translation.updatedAt,
	}
}

// Updated type definition with proper Prisma include structure
type AssessmentQuestionWithTranslations = AssessmentQuestion & {
	answers: (AssessmentAnswer & {
		AssessmentAnswerTranslation: AssessmentAnswerTranslation[]
	})[]
	AssessmentQuestionTranslation: AssessmentQuestionTranslation[]
}

export function toAssessmentQuestionWithTranslationsDto(
	question: AssessmentQuestionWithTranslations,
): AssessmentQuestionWithTranslationsDto {
	return {
		id: question.id,
		proficiencyLevelId: question.proficiencyLevelId,
		question: question.question,
		imageKey: question.image_key ?? undefined,
		answers: question.answers.map(answer => ({
			id: answer.id,
			questionId: answer.questionId,
			answer: answer.answer,
			isCorrect: answer.isCorrect,
			translations: answer.AssessmentAnswerTranslation?.map(toAssessmentAnswerTranslationDto) || [],
		})),
		translations:
			question.AssessmentQuestionTranslation?.map(qt => {
				// Find related answer translations for this question translation
				const relatedAnswerTranslations = question.answers.flatMap(answer =>
					answer.AssessmentAnswerTranslation.filter(at => at.language === qt.language),
				)
				return toAssessmentQuestionTranslationDto(qt, relatedAnswerTranslations)
			}) || [],
	}
}

// Helper functions remain the same
export function applyAssessmentQuestionTranslation(
	question: AssessmentQuestion,
	translations: AssessmentQuestionTranslation[],
	userLanguage: NATIVE_LANGUAGE,
): AssessmentQuestion {
	const translation = translations.find(t => t.language === userLanguage)

	if (!translation) {
		return question
	}

	return {
		...question,
		question: translation.question,
	}
}

export function applyAssessmentAnswerTranslation(
	answer: AssessmentAnswer,
	translations: AssessmentAnswerTranslation[],
	userLanguage: NATIVE_LANGUAGE,
): AssessmentAnswer {
	const translation = translations.find(t => t.language === userLanguage)

	if (!translation) {
		return answer
	}

	return {
		...answer,
		answer: translation.answer,
	}
}
