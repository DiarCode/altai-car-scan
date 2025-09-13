import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { Exercise, EXERCISE_TYPE } from '@prisma/client'

import { BaseExerciseDto, ExerciseDto } from '../dtos/exercises.dtos'
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
import { MediaUrlService } from 'src/common/services/media-url.service'

/**
 * Map a Prisma `exercise` record → base‐only DTO (no payload details).
 */
export function mapToBaseExerciseDto(record: Exercise): BaseExerciseDto {
	const { id, title, interestSegmentId, type, status, createdAt, updatedAt } = record
	return {
		id: id,
		title: title,
		interestSegmentId: interestSegmentId,
		type: type,
		status: status,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

/**
 * Map a full Prisma `exercise` record → typed ExerciseDto,
 * merging in a validated payload instance.
 */
export function mapToFullExerciseDto(record: Exercise): ExerciseDto {
	const base = mapToBaseExerciseDto(record)
	const raw = record.payload

	let instance: unknown
	const transformOpts = { excludeExtraneousValues: true }

	switch (record.type) {
		case EXERCISE_TYPE.FLASHCARD: {
			const dto = plainToInstance(FlashcardPayload, raw, transformOpts)
			dto.cards.forEach(card => {
				if (card.imageUrl) card.imageUrl = MediaUrlService.buildMediaUrl(card.imageUrl)
				if (card.audioUrl) card.audioUrl = MediaUrlService.buildMediaUrl(card.audioUrl)
			})
			instance = dto
			break
		}

		case EXERCISE_TYPE.CLOZE:
			instance = plainToInstance(ClozePayload, raw, transformOpts)
			break

		case EXERCISE_TYPE.SENTENCE_REORDER:
			instance = plainToInstance(SentenceReorderPayload, raw, transformOpts)
			break

		case EXERCISE_TYPE.MULTIPLE_CHOICE: {
			instance = plainToInstance(MultipleChoicePayload, raw, transformOpts)
			break
		}

		case EXERCISE_TYPE.DICTATION: {
			const dto = plainToInstance(DictationPayload, raw, transformOpts)
			dto.audioUrl = MediaUrlService.buildMediaUrl(dto.audioUrl)
			instance = dto
			break
		}

		case EXERCISE_TYPE.LISTENING_QUIZ: {
			const dto = plainToInstance(ListeningQuizPayload, raw, transformOpts)
			dto.questions.forEach(q => {
				q.audioUrl = MediaUrlService.buildMediaUrl(q.audioUrl)
			})
			instance = dto
			break
		}

		case EXERCISE_TYPE.PRONUNCIATION: {
			const dto = plainToInstance(PronunciationPayload, raw, transformOpts)
			dto.audioUrl = MediaUrlService.buildMediaUrl(dto.audioUrl)
			instance = dto
			break
		}

		case EXERCISE_TYPE.PICTURE_DESCRIPTION: {
			const dto = plainToInstance(PictureDescriptionPayload, raw, transformOpts)
			dto.imageUrl = MediaUrlService.buildMediaUrl(dto.imageUrl ?? '')
			instance = dto
			break
		}

		default:
			throw new Error(`Unsupported exercise type: ${String(record.type)}`)
	}

	const errors = validateSync(instance as object, {
		whitelist: true,
		forbidNonWhitelisted: true,
	})
	if (errors.length > 0) {
		throw new Error(`Invalid payload for ${record.type}: ${JSON.stringify(errors)}`)
	}

	return { ...base, ...(instance as object) } as ExerciseDto
}
