import { EXERCISE_TYPE } from '@prisma/client'
import {
	FlashcardPayload,
	ClozePayload,
	SentenceReorderPayload,
	MultipleChoicePayload,
	DictationPayload,
	PronunciationPayload,
	PictureDescriptionPayload,
	MultipleChoiceAnswer,
	MultipleChoiceQuestion,
	ListeningQuizPayload,
} from '../dtos/exercise-payload.types'
import { AdapterExerciseDto } from './exercise-adapter.types'
import { isObject } from 'src/common/utils/types.util'

/** Runtime guard: checks that obj is AdapterExerciseDto<T>[] */
export function isAdapterExerciseDtoArray<T extends EXERCISE_TYPE>(
	arr: unknown,
	type: T,
): arr is Array<AdapterExerciseDto<T>> {
	return Array.isArray(arr) && arr.every(item => isAdapterExerciseDto(item, type))
}

/** Runtime guard: checks that obj is AdapterExerciseDto<T> */
export function isAdapterExerciseDto<T extends EXERCISE_TYPE>(
	obj: unknown,
	type: T,
): obj is AdapterExerciseDto<T> {
	if (!isObject(obj)) {
		return false
	}

	const recType = obj.type
	const payload = obj.payload

	// recType must be a string and exactly match our generic `type`
	if (typeof recType !== 'string' || recType !== type) {
		return false
	}

	// payload must be an object
	if (!isObject(payload)) {
		return false
	}

	// Now switch on the *typed* `type` parameter, not recType
	switch (type) {
		case EXERCISE_TYPE.FLASHCARD:
			return isFlashcardPayload(payload)

		case EXERCISE_TYPE.CLOZE:
			return isClozePayload(payload)

		case EXERCISE_TYPE.SENTENCE_REORDER:
			return isSentenceReorderPayload(payload)

		case EXERCISE_TYPE.MULTIPLE_CHOICE:
			return isMultipleChoicePayload(payload)

		case EXERCISE_TYPE.DICTATION:
			return isDictationPayload(payload)

		case EXERCISE_TYPE.LISTENING_QUIZ:
			return isListeningQuizPayload(payload)

		case EXERCISE_TYPE.PRONUNCIATION:
			return isPronunciationPayload(payload)

		case EXERCISE_TYPE.PICTURE_DESCRIPTION:
			return isPictureDescriptionPayload(payload)

		default:
			return false
	}
}

export function isFlashcardPayload(obj: unknown): obj is FlashcardPayload {
	if (typeof obj !== 'object' || obj === null) {
		return false
	}
	const { cards } = obj as FlashcardPayload
	if (!Array.isArray(cards) || cards.length < 1) {
		return false
	}
	const allCardsValid = cards.every(
		card =>
			typeof card.word === 'string' &&
			typeof card.definition === 'string' &&
			typeof card.exampleSentence === 'string' &&
			(card.imageUrl === undefined || typeof card.imageUrl === 'string') &&
			(card.audioUrl === undefined || typeof card.audioUrl === 'string'),
	)
	return allCardsValid
}

export function isClozePayload(obj: unknown): obj is ClozePayload {
	if (typeof obj !== 'object' || obj === null) {
		return false
	}
	const { sentences } = obj as ClozePayload
	if (!Array.isArray(sentences) || sentences.length < 1) {
		return false
	}
	const allSentencesValid = sentences.every(
		item =>
			typeof item.text === 'string' &&
			Array.isArray(item.answers) &&
			item.answers.every(ans => typeof ans === 'string'),
	)
	return allSentencesValid
}

export function isSentenceReorderPayload(obj: unknown): obj is SentenceReorderPayload {
	if (typeof obj !== 'object' || obj === null) {
		return false
	}
	const { fragments } = obj as SentenceReorderPayload
	if (!Array.isArray(fragments) || fragments.some(f => typeof f !== 'string')) {
		return false
	}
	return true
}

export function isMultipleChoicePayload(obj: unknown): obj is MultipleChoicePayload {
	if (typeof obj !== 'object' || obj === null) {
		return false
	}
	const { questions } = obj as MultipleChoicePayload

	if (!Array.isArray(questions) || questions.length < 1) {
		return false
	}

	const allQuestionsValid = questions.every((q: unknown) => {
		if (typeof q !== 'object' || q === null) return false
		const { question, options } = q as MultipleChoiceQuestion

		if (typeof question !== 'string') return false
		if (!Array.isArray(options) || options.length < 1) return false

		const optionsValid = options.every((o: unknown) => {
			if (typeof o !== 'object' || o === null) return false
			const { answer, isCorrect } = o as MultipleChoiceAnswer
			return typeof answer === 'string' && typeof isCorrect === 'boolean'
		})
		if (!optionsValid) return false

		return true
	})

	if (!allQuestionsValid) {
		return false
	}

	return true
}

/** 5) DICTATION PRACTICE */
export function isDictationPayload(obj: unknown): obj is DictationPayload {
	if (typeof obj !== 'object' || obj === null) return false
	const rec = obj as Record<string, unknown>

	if (typeof rec.transcript !== 'string') return false
	if (typeof rec.audioUrl !== 'string') return false

	return true
}

/** 6) INTERACTIVE LISTENING QUIZ */
export function isListeningQuizPayload(obj: unknown): obj is ListeningQuizPayload {
	if (typeof obj !== 'object' || obj === null) return false
	const rec = obj as Record<string, unknown>

	const qs = rec.questions
	if (!Array.isArray(qs) || qs.length === 0) return false

	for (const rawQ of qs) {
		if (typeof rawQ !== 'object' || rawQ === null) return false
		const q = rawQ as Record<string, unknown>

		if (q.audioUrl !== undefined && typeof q.audioUrl !== 'string') return false

		if (typeof q.question !== 'string') return false

		const opts = q.options
		if (!Array.isArray(opts) || opts.length === 0) return false
		for (const rawO of opts) {
			if (typeof rawO !== 'object' || rawO === null) return false
			const o = rawO as Record<string, unknown>
			if (typeof o.answer !== 'string') return false
			if (typeof o.correct !== 'boolean') return false
		}
	}

	return true
}

/** 7) PRONUNCIATION PRACTICE */
export function isPronunciationPayload(obj: unknown): obj is PronunciationPayload {
	if (typeof obj !== 'object' || obj === null) return false
	const rec = obj as Record<string, unknown>

	if (typeof rec.text !== 'string') return false
	if (rec.audioUrl !== undefined && typeof rec.audioUrl !== 'string') return false

	return true
}

/** 8) PICTURE DESCRIPTION */
export function isPictureDescriptionPayload(obj: unknown): obj is PictureDescriptionPayload {
	if (typeof obj !== 'object' || obj === null) return false
	const rec = obj as Record<string, unknown>

	if (typeof rec.prompt !== 'string') return false

	if (rec.expectedKeywords !== undefined) {
		if (!Array.isArray(rec.expectedKeywords)) return false
		if (rec.expectedKeywords.some(k => typeof k !== 'string')) return false
	}

	if (rec.imageUrl !== undefined && typeof rec.imageUrl !== 'string') return false

	return true
}
