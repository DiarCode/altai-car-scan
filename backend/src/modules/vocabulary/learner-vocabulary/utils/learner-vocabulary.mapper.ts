// src/modules/vocabulary/learner-vocabulary/utils/learner-vocabulary.mapper.ts

import {
	MemorizeResponseDto,
	ExplainResponseDto,
	ReviewItemDto,
	ReviewAnswerResponseDto,
	LearnerVocabularyDto,
	LearnerVocabularyProgressDto,
} from '../dtos/learner-vocabulary.dtos'
import { LearnerVocabularyProgress, LearnerVocabulary } from '@prisma/client'

/**
 * Maps a LearnerVocabulary record to a LearnerVocabularyDto.
 */
export function toLearnerVocabularyDto(lv: LearnerVocabulary): LearnerVocabularyDto {
	const dto = new LearnerVocabularyDto()
	dto.id = lv.id
	dto.word = lv.word
	dto.translation = lv.translation
	dto.description = lv.description
	dto.example = lv.example ?? ''
	return dto
}

/**
 * Maps a LearnerVocabularyProgress record to a LearnerVocabularyProgressDto.
 */
export function toLearnerVocabularyProgressDto(
	prog: LearnerVocabularyProgress,
): LearnerVocabularyProgressDto {
	const dto = new LearnerVocabularyProgressDto()
	dto.id = prog.id
	dto.learnerId = prog.learnerId
	dto.learnerVocabularyId = prog.learnerVocabularyId
	dto.masteryLevel = prog.masteryLevel
	dto.streak = prog.streak
	dto.nextReviewAt = prog.nextReviewAt
	return dto
}

/**
 * Maps a LearnerVocabularyProgress record to a memorization response.
 */
export function toMemorizeResponse(prog: LearnerVocabularyProgress): MemorizeResponseDto {
	const dto = new MemorizeResponseDto()
	dto.masteryLevel = prog.masteryLevel
	dto.nextReviewAt = prog.nextReviewAt
	return dto
}

/**
 * Maps an explanation and updated progress into the ExplainResponseDto.
 */
export function toExplainResponse(
	explanation: string,
	prog: LearnerVocabularyProgress,
): ExplainResponseDto {
	const dto = new ExplainResponseDto()
	dto.explanation = explanation
	dto.masteryLevel = prog.masteryLevel
	dto.nextReviewAt = prog.nextReviewAt
	return dto
}

/**
 * Maps a progress+vocab join into a ReviewItemDto.
 */
export function toReviewItem(
	prog: LearnerVocabularyProgress & { learnerVocabulary: LearnerVocabulary },
): ReviewItemDto {
	const dto = new ReviewItemDto()
	dto.learnerVocabularyId = prog.learnerVocabulary.id
	dto.word = prog.learnerVocabulary.word
	dto.translation = prog.learnerVocabulary.translation
	dto.description = prog.learnerVocabulary.description
	dto.example = prog.learnerVocabulary.example ?? ''
	dto.masteryLevel = prog.masteryLevel
	return dto
}

/**
 * Maps updated progress into a ReviewAnswerResponseDto.
 */
export function toReviewAnswerResponse(prog: LearnerVocabularyProgress): ReviewAnswerResponseDto {
	const dto = new ReviewAnswerResponseDto()
	dto.masteryLevel = prog.masteryLevel
	dto.streak = prog.streak
	dto.nextReviewAt = prog.nextReviewAt
	return dto
}
