import { EXERCISE_TYPE } from '@prisma/client'
import {
	FlashcardPayload,
	ClozePayload,
	SentenceReorderPayload,
	MultipleChoicePayload,
	DictationPayload,
	ListeningQuizPayload,
	PronunciationPayload,
	PictureDescriptionPayload,
} from '../dtos/exercise-payload.types'

type ExercisePayloadMap = {
	[EXERCISE_TYPE.FLASHCARD]: FlashcardPayload
	[EXERCISE_TYPE.CLOZE]: ClozePayload
	[EXERCISE_TYPE.SENTENCE_REORDER]: SentenceReorderPayload
	[EXERCISE_TYPE.MULTIPLE_CHOICE]: MultipleChoicePayload
	[EXERCISE_TYPE.DICTATION]: DictationPayload
	[EXERCISE_TYPE.LISTENING_QUIZ]: ListeningQuizPayload
	[EXERCISE_TYPE.PRONUNCIATION]: PronunciationPayload
	[EXERCISE_TYPE.PICTURE_DESCRIPTION]: PictureDescriptionPayload
}

export class AdapterExerciseDto<T extends EXERCISE_TYPE = EXERCISE_TYPE> {
	title!: string
	type!: T
	payload!: ExercisePayloadMap[T]
}
