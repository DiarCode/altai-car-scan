import { EXERCISE_TYPE } from '@prisma/client'
import {
	isFlashcardPayload,
	isClozePayload,
	isSentenceReorderPayload,
	isMultipleChoicePayload,
	isDictationPayload,
	isListeningQuizPayload,
	isPronunciationPayload,
	isPictureDescriptionPayload,
} from '../adapters/exercise-types.guards'

export const payloadValidators: Record<EXERCISE_TYPE, (obj: unknown) => boolean> = {
	[EXERCISE_TYPE.FLASHCARD]: isFlashcardPayload,
	[EXERCISE_TYPE.CLOZE]: isClozePayload,
	[EXERCISE_TYPE.SENTENCE_REORDER]: isSentenceReorderPayload,
	[EXERCISE_TYPE.MULTIPLE_CHOICE]: isMultipleChoicePayload,
	[EXERCISE_TYPE.DICTATION]: isDictationPayload,
	[EXERCISE_TYPE.LISTENING_QUIZ]: isListeningQuizPayload,
	[EXERCISE_TYPE.PRONUNCIATION]: isPronunciationPayload,
	[EXERCISE_TYPE.PICTURE_DESCRIPTION]: isPictureDescriptionPayload,
}
