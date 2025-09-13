// src/modules/vocabulary/learner-vocabulary/learner-vocabulary.controller.ts

import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards, Query } from '@nestjs/common'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { LearnerVocabularyService } from './learner-vocabulary.service'

import {
	ExplainResponseDto,
	MemorizeResponseDto,
	ReviewAnswerResponseDto,
	ReviewItemDto,
	LearnerVocabularyDto,
	LearnerVocabularyProgressDto,
	LearnerVocabularyFilter,
} from './dtos/learner-vocabulary.dtos'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { PaginatedResponse } from 'src/common/utils/pagination.util'

@Controller('learner-vocabulary')
@UseGuards(LearnerAuthGuard)
export class LearnerVocabularyController {
	constructor(private readonly svc: LearnerVocabularyService) {}

	/** 1. Memorize a word */
	@Post('memorize/:moduleVocId')
	async memorize(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleVocId', ParseIntPipe) moduleVocId: number,
	): Promise<MemorizeResponseDto> {
		return this.svc.memorizeWord(learner.id, moduleVocId)
	}

	/** 2. Get all vocabulary for a learner */
	@Get()
	async getLearnerVocabulary(
		@GetCurrentLearner() learner: LearnerClaims,
		@Query() filters: LearnerVocabularyFilter,
	): Promise<PaginatedResponse<LearnerVocabularyDto>> {
		return this.svc.getLearnerVocabulary(learner.id, filters)
	}

	/** 3. Get a single vocabulary item by ID */
	@Get(':learnerVocId')
	async getLearnerVocabularyById(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('learnerVocId', ParseIntPipe) learnerVocId: number,
	): Promise<LearnerVocabularyDto> {
		return this.svc.getLearnerVocabularyById(learner.id, learnerVocId)
	}

	/** 4. Get progress for a vocabulary item */
	@Get(':learnerVocId/progress')
	async getLearnerVocabularyProgress(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('learnerVocId', ParseIntPipe) learnerVocId: number,
	): Promise<LearnerVocabularyProgressDto> {
		return this.svc.getLearnerVocabularyProgress(learner.id, learnerVocId)
	}

	/** 5. Explain a word */
	@Get(':learnerVocId/explain')
	async explain(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('learnerVocId', ParseIntPipe) learnerVocId: number,
	): Promise<ExplainResponseDto> {
		return this.svc.explainWord(learnerVocId, learner.id)
	}

	/** 6. Fetch due reviews */
	@Get('reviews/due')
	async fetchReviews(@GetCurrentLearner() learner: LearnerClaims): Promise<ReviewItemDto[]> {
		return this.svc.fetchDueReviews(learner.id)
	}

	/** 7. Submit review answer */
	@Post('review/:learnerVocId')
	async reviewAnswer(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('learnerVocId', ParseIntPipe) learnerVocId: number,
		@Body('correct') correct: boolean,
	): Promise<ReviewAnswerResponseDto> {
		return this.svc.submitReviewAnswer(learner.id, learnerVocId, correct)
	}
}
