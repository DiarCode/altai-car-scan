// src/modules/vocabulary/learner-vocabulary/learner-vocabulary.service.ts

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { addDays } from 'date-fns'

import {
	ExplainResponseDto,
	MemorizeResponseDto,
	ReviewAnswerResponseDto,
	ReviewItemDto,
	LearnerVocabularyDto,
	LearnerVocabularyProgressDto,
	LearnerVocabularyFilter,
} from './dtos/learner-vocabulary.dtos'
import { VocabularyExplanationAdapter } from './adapters/vocabulary-explanation-adapter.interface'
import {
	toExplainResponse,
	toMemorizeResponse,
	toReviewAnswerResponse,
	toReviewItem,
	toLearnerVocabularyDto,
	toLearnerVocabularyProgressDto,
} from './utils/learner-vocabulary.mapper'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { Prisma } from '@prisma/client'

@Injectable()
export class LearnerVocabularyService {
	private reviewDayIntervals = [1, 3, 7, 14, 30]

	constructor(
		private readonly prisma: PrismaService,
		@Inject('VocabularyExplanationAdapter')
		private readonly explainer: VocabularyExplanationAdapter,
	) {}

	/** 1. Memorize a word **/
	async memorizeWord(learnerId: number, moduleVocId: number): Promise<MemorizeResponseDto> {
		const now = new Date()

		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
		})
		if (!learner) throw new NotFoundException(`Learner ${learnerId} not found`)

		// fetch module source
		const src = await this.prisma.moduleVocabulary.findUnique({
			where: { id: moduleVocId },
			include: { translations: true },
		})
		if (!src) throw new NotFoundException(`ModuleVocabulary ${moduleVocId} not found`)

		const localizedContent = src.translations.find(t => t.language === learner.nativeLanguage)

		if (!localizedContent || !localizedContent.translation || !localizedContent.description) {
			throw new NotFoundException(
				`Translation or description not found for language ${learner.nativeLanguage}`,
			)
		}

		// find-or-create learner copy
		let lv = await this.prisma.learnerVocabulary.findFirst({
			where: { learnerId, word: src.word },
		})
		if (!lv) {
			lv = await this.prisma.learnerVocabulary.create({
				data: {
					learnerId,
					word: src.word,
					translation: localizedContent.translation,
					description: localizedContent.description,
					example: src.example,
				},
			})
		}

		// find-or-create progress
		let prog = await this.prisma.learnerVocabularyProgress.findFirst({
			where: { learnerVocabularyId: lv.id },
		})
		if (!prog) {
			prog = await this.prisma.learnerVocabularyProgress.create({
				data: {
					learnerVocabularyId: lv.id,
					learnerId,
					masteryLevel: 1,
					streak: 1,
					nextReviewAt: addDays(now, this.reviewDayIntervals[0]),
				},
			})
		} else {
			// bump mastery and streak
			const nextLevel = Math.min(prog.masteryLevel + 1, this.reviewDayIntervals.length)
			prog = await this.prisma.learnerVocabularyProgress.update({
				where: { id: prog.id },
				data: {
					masteryLevel: nextLevel,
					streak: prog.streak + 1,
					nextReviewAt: addDays(now, this.reviewDayIntervals[nextLevel - 1]),
				},
			})
		}

		return toMemorizeResponse(prog)
	}

	/** 2. Get all vocabulary for a learner **/
	async getLearnerVocabulary(
		learnerId: number,
		filters: LearnerVocabularyFilter,
	): Promise<PaginatedResponse<LearnerVocabularyDto>> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
		})
		if (!learner) throw new NotFoundException(`Learner ${learnerId} not found`)

		const where: Prisma.LearnerVocabularyWhereInput = {
			learnerId: learnerId,
		}

		if (filters.search) {
			where.OR = [
				{ word: { contains: filters.search, mode: 'insensitive' } },
				{ translation: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
				{ example: { contains: filters.search, mode: 'insensitive' } },
			]
		}

		const paginatedVocab = await paginatePrisma(
			this.prisma.learnerVocabulary,
			{ where },
			this.prisma.learnerVocabulary,
			{ where },
			filters,
		)

		return {
			...paginatedVocab,
			data: paginatedVocab.data.map(toLearnerVocabularyDto),
		}
	}

	/** 3. Get a single vocabulary item by ID **/
	async getLearnerVocabularyById(
		learnerId: number,
		learnerVocabularyId: number,
	): Promise<LearnerVocabularyDto> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
		})
		if (!learner) throw new NotFoundException(`Learner ${learnerId} not found`)

		const lv = await this.prisma.learnerVocabulary.findUnique({
			where: { id: learnerVocabularyId, learnerId },
		})
		if (!lv) throw new NotFoundException(`LearnerVocabulary ${learnerVocabularyId} not found`)

		return toLearnerVocabularyDto(lv)
	}

	/** 4. Get progress for a vocabulary item **/
	async getLearnerVocabularyProgress(
		learnerId: number,
		learnerVocabularyId: number,
	): Promise<LearnerVocabularyProgressDto> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
		})
		if (!learner) throw new NotFoundException(`Learner ${learnerId} not found`)

		const prog = await this.prisma.learnerVocabularyProgress.findFirst({
			where: { learnerVocabularyId, learnerId },
		})
		if (!prog) throw new NotFoundException(`Progress for vocab ${learnerVocabularyId} not found`)

		return toLearnerVocabularyProgressDto(prog)
	}

	/** 5. Explain a word **/
	async explainWord(learnerVocabularyId: number, learnerId: number): Promise<ExplainResponseDto> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
		})
		if (!learner) throw new NotFoundException(`Learner ${learnerId} not found`)

		const lv = await this.prisma.learnerVocabulary.findUnique({
			where: { id: learnerVocabularyId },
		})
		if (!lv) throw new NotFoundException(`LearnerVocabulary ${learnerVocabularyId} not found`)

		// delegate to adapter
		const explanation = await this.explainer.explain(
			lv.word,
			learner.nativeLanguage,
			lv.description,
		)

		// bump progress as before...
		const prog = await this.prisma.learnerVocabularyProgress.findFirst({
			where: { learnerVocabularyId: lv.id },
		})
		if (!prog) throw new NotFoundException(`Progress for vocab ${lv.id} not found`)

		const now = new Date()
		const nextLevel = Math.min(prog.masteryLevel + 1, this.reviewDayIntervals.length)
		const updated = await this.prisma.learnerVocabularyProgress.update({
			where: { id: prog.id },
			data: {
				masteryLevel: nextLevel,
				streak: prog.streak + 1,
				nextReviewAt: addDays(now, this.reviewDayIntervals[nextLevel - 1]),
			},
		})

		return toExplainResponse(explanation, updated)
	}
	/** 6. Fetch due reviews **/
	async fetchDueReviews(learnerId: number): Promise<ReviewItemDto[]> {
		const now = new Date()
		const due = await this.prisma.learnerVocabularyProgress.findMany({
			where: {
				learnerId,
				nextReviewAt: { lte: now },
				masteryLevel: { lt: this.reviewDayIntervals.length + 1 },
			},
			include: { learnerVocabulary: true },
			orderBy: { nextReviewAt: 'asc' },
			take: 5,
		})

		return due.map(d => toReviewItem(d))
	}

	/** 7. Submit review answer **/
	async submitReviewAnswer(
		learnerId: number,
		learnerVocabularyId: number,
		correct: boolean,
	): Promise<ReviewAnswerResponseDto> {
		const now = new Date()
		const prog = await this.prisma.learnerVocabularyProgress.findFirst({
			where: { learnerVocabularyId, learnerId },
		})
		if (!prog) throw new NotFoundException(`No review found for ID ${learnerVocabularyId}`)

		let masteryLevel = prog.masteryLevel
		let streak = prog.streak

		if (correct) {
			streak = streak + 1
			masteryLevel = Math.min(masteryLevel + 1, this.reviewDayIntervals.length)
		} else {
			streak = 0
			masteryLevel = Math.max(masteryLevel - 1, 1)
		}

		const nextReviewAt = addDays(now, this.reviewDayIntervals[masteryLevel - 1])
		const updated = await this.prisma.learnerVocabularyProgress.update({
			where: { id: prog.id },
			data: { masteryLevel, streak, nextReviewAt },
		})

		return toReviewAnswerResponse(updated)
	}
}
