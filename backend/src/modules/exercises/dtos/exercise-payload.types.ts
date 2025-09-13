import {
	IsString,
	IsArray,
	ValidateNested,
	ArrayMinSize,
	IsOptional,
	IsBoolean,
	IsObject,
} from 'class-validator'
import { Expose, Type } from 'class-transformer'

/**
 * 1) FLASHCARD
 */
export class FlashcardCard {
	@Expose()
	@IsString()
	word!: string

	@Expose()
	@IsString()
	definition!: string

	@Expose()
	@IsString()
	exampleSentence!: string

	@Expose()
	@IsOptional()
	@IsString()
	imageUrl?: string

	@Expose()
	@IsOptional()
	@IsString()
	audioUrl?: string
}

export class FlashcardPayload {
	@Expose()
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => FlashcardCard)
	cards!: FlashcardCard[]
}

/**
 * 2) CLOZE TEST
 */
export class ClozeItem {
	@Expose()
	@IsString()
	text!: string

	@Expose()
	@IsArray()
	@IsString({ each: true })
	answers!: string[]
}

export class ClozePayload {
	@Expose()
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => ClozeItem)
	sentences!: ClozeItem[]
}

/**
 * 3) SENTENCE REORDER
 */
export class SentenceReorderPayload {
	@Expose()
	@IsArray()
	@IsString({ each: true })
	fragments!: string[]
}

/**
 * 4) MULTIPLE-CHOICE GRAMMAR QUIZ
 */
export class MultipleChoiceQuestion {
	@Expose()
	@IsString()
	question!: string

	@Expose()
	@IsArray()
	@IsObject({ each: true })
	options!: MultipleChoiceAnswer[]
}

export class MultipleChoiceAnswer {
	@Expose()
	@IsString()
	answer!: string

	@Expose()
	@IsBoolean()
	isCorrect!: boolean
}

export class MultipleChoicePayload {
	@Expose()
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => MultipleChoiceQuestion)
	questions!: MultipleChoiceQuestion[]
}

/** 5) DICTATION PRACTICE: Listens to audio and types what was heard */
export class DictationPayload {
	@Expose()
	@IsString()
	transcript!: string // text for TTS and user input verification (we will compare this with what user typed)

	@Expose()
	@IsString()
	audioUrl!: string // filled in after upload
}

/** 6) INTERACTIVE LISTENING QUIZ: Listens to audio and answers the question*/
export class ListeningQuizAnswer {
	@Expose()
	@IsString()
	answer!: string

	@Expose()
	@IsBoolean()
	correct!: boolean
}

export class ListeningQuizQuestion {
	@Expose()
	@IsString()
	audioUrl!: string // filled post-upload

	@Expose()
	@IsString()
	question!: string

	@Expose()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ListeningQuizAnswer)
	@ArrayMinSize(1)
	options!: ListeningQuizAnswer[]
}

export class ListeningQuizPayload {
	@Expose()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ListeningQuizQuestion)
	@ArrayMinSize(1)
	questions!: ListeningQuizQuestion[]
}

/** 7) PRONUNCIATION PRACTICE: User must read the given text or repeat the generated audio out loud and the AI gives user some score */
export class PronunciationPayload {
	@Expose()
	@IsString()
	text!: string // text to speak

	@Expose()
	@IsString()
	audioUrl!: string // filled in after upload
}

/** 8) PICTURE DESCRIPTION */
export class PictureDescriptionPayload {
	@Expose()
	@IsString()
	prompt!: string // text prompt for image

	@Expose()
	@IsString()
	imageUrl?: string // filled in after upload

	@Expose()
	@IsArray()
	@IsString({ each: true })
	expectedKeywords: string[]
}
