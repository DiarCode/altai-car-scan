import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
	AssessmentQuestion,
	AssessmentAnswer,
	LEVEL_CODE,
	Prisma,
	ProficiencyLevel,
	NATIVE_LANGUAGE,
} from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotificationsApi } from '../notifications/notifications.service'
import {
	AssessmentTestFilter,
	AssessmentTestDto,
	UpsertQuestionDto,
	AssessmentQuestionDto,
	SubmitAssessmentTestDto,
	AssessmentTestAdminFilter,
	AdminAssessmentQuestionDto,
	SubmitAssessmentTestResponseDto,
} from './dtos/assessment.dtos'
import {
	mapTestModelToDto,
	mapAdaptiveSubmitResponse,
	mapQuestionModelToAdminQuestionDto,
} from './utils/assessment.mapper'
import { mapPaginatedResponse, PaginatedResponse } from 'src/common/utils/pagination.util'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { S3Service } from 'src/common/s3/s3.service'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import {
	applyAssessmentQuestionTranslation,
	applyAssessmentAnswerTranslation,
} from '../translations/utils/translations-mapper.util'

type QuestionWithAnswers = AssessmentQuestion & { answers: AssessmentAnswer[] }
type QuestionWithAnswersAndLevel = AssessmentQuestion & {
	answers: AssessmentAnswer[]
	proficiencyLevel: ProficiencyLevel
}

@Injectable()
export class AssessmentService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly s3: S3Service,
		private readonly notificationsApi: NotificationsApi,
	) {}

	private assessmentFolder: string = 'assessment-tests' // Default folder

	/**
	 * GET /assessment-test?questionsPerLevel=3
	 * Returns questions for ALL available levels organized by level with translations
	 */
	async getTestForLearner(
		filter: AssessmentTestFilter,
		learnerLanguage: NATIVE_LANGUAGE,
	): Promise<AssessmentTestDto> {
		const questionsPerLevel = filter.questionsPerLevel || 3

		// Get all available levels from database
		const availableLevels = await this.getAvailableLevels()

		// Get questions for available levels and organize by level
		const questionsByLevel = new Map<LEVEL_CODE, QuestionWithAnswersAndLevel[]>()

		for (const levelCode of availableLevels) {
			const levelQuestions = await this.getQuestionsForLevelWithTranslations(
				levelCode,
				questionsPerLevel,
				learnerLanguage,
			)
			if (levelQuestions.length > 0) {
				questionsByLevel.set(levelCode, levelQuestions)
			}
		}

		return mapTestModelToDto(questionsByLevel)
	}
	// ─── PRIVATE HELPER METHODS ─────────────────────────────────────────────────

	private async getAvailableLevels(): Promise<LEVEL_CODE[]> {
		const levels = await this.prisma.proficiencyLevel.findMany({
			select: { code: true },
			orderBy: { code: 'asc' },
		})

		return levels.map(level => level.code)
	}

	private async getQuestionsForLevelWithTranslations(
		levelCode: LEVEL_CODE,
		count: number,
		learnerLanguage: NATIVE_LANGUAGE,
	): Promise<QuestionWithAnswersAndLevel[]> {
		// 1) ensure level exists
		const level = await this.prisma.proficiencyLevel.findUnique({
			where: { code: levelCode },
			select: { id: true },
		})
		if (!level) {
			throw new NotFoundException(`Proficiency level ${levelCode} not found`)
		}

		const where = { proficiencyLevelId: level.id }

		// 2) how many candidates?
		const total = await this.prisma.assessmentQuestion.count({ where })
		if (total < count) {
			throw new BadRequestException(
				`Not enough questions for level "${levelCode}": requested ${count}, but only ${total} available.`,
			)
		}

		// 3) pick `count` unique random offsets [0..total-1]
		const offsets = new Set<number>()
		while (offsets.size < count) {
			offsets.add(Math.floor(Math.random() * total))
		}

		// 4) fetch each question at its offset with translations
		const fetches = Array.from(offsets).map(offset =>
			this.prisma.assessmentQuestion.findFirst({
				where,
				include: {
					answers: {
						include: {
							AssessmentAnswerTranslation: true,
						},
					},
					proficiencyLevel: true,
					AssessmentQuestionTranslation: true,
				},
				skip: offset,
			}),
		)
		const rawQuestions = (await Promise.all(fetches)).filter(q => q !== null)

		// 5) apply translations based on learner's language
		const questions = rawQuestions
			.map(question => {
				if (!question) return null

				// Apply question translation
				const translatedQuestion = applyAssessmentQuestionTranslation(
					question,
					question.AssessmentQuestionTranslation,
					learnerLanguage,
				)

				// Apply answer translations
				const translatedAnswers = question.answers.map(answer =>
					applyAssessmentAnswerTranslation(
						answer,
						answer.AssessmentAnswerTranslation,
						learnerLanguage,
					),
				)

				return {
					...translatedQuestion,
					answers: translatedAnswers,
					proficiencyLevel: question.proficiencyLevel,
				}
			})
			.filter((q): q is QuestionWithAnswersAndLevel => q !== null)

		// 6) sanity check
		if (questions.length < count) {
			throw new BadRequestException(
				`Unexpected: only fetched ${questions.length} questions out of ${count}.`,
			)
		}

		return questions
	}
	/**
	 * POST /assessment-test
	 * Process adaptive test results and assign appropriate level
	 */
	async submitAssessmentTest(
		learnerId: number,
		dto: SubmitAssessmentTestDto,
	): Promise<SubmitAssessmentTestResponseDto> {
		// Calculate level assignment based on adaptive test results
		const response = mapAdaptiveSubmitResponse(dto.selfLevel, dto.answers, dto.questionsPerLevel)

		// Update learner's assigned level in database
		await this.updateLearnerAssignedLevel(learnerId, response.assignedLevel)

		// Send level assigned notification (localized)
		await this.notificationsApi.levelAssigned(learnerId, response.assignedLevel)

		return response
	}

	private async updateLearnerAssignedLevel(
		learnerId: number,
		assignedLevel: LEVEL_CODE,
	): Promise<void> {
		await this.prisma.learner.update({
			where: { id: learnerId },
			data: {
				assignedLevel: {
					connect: { code: assignedLevel },
				},
			},
		})
	}

	//----- ADMIN endpoints------
	/** PUT /assessment-test/questions (single upsert) */
	async upsertQuestion(
		dto: UpsertQuestionDto,
		file?: Express.Multer.File,
	): Promise<AdminAssessmentQuestionDto> {
		// Get proficiency level to retrieve the code for folder structure
		const proficiencyLevel = await this.prisma.proficiencyLevel.findUnique({
			where: { id: dto.proficiencyLevelId },
			select: { code: true },
		})

		if (!proficiencyLevel) {
			throw new NotFoundException(`Proficiency level with ID ${dto.proficiencyLevelId} not found`)
		}

		// If updating, load existing to get old image_key
		const existing = dto.id
			? await this.prisma.assessmentQuestion.findUnique({
					where: { id: dto.id },
					select: { image_key: true },
				})
			: null

		// Handle image replacement
		const imageKey = file
			? await this.replaceImage(existing?.image_key, file, proficiencyLevel.code)
			: existing?.image_key

		// Build the upsert payload
		const payload = this.buildQuestionPayload(dto, imageKey ?? undefined)

		// Create vs update
		let question: QuestionWithAnswers
		if (dto.id) {
			question = await this.prisma.assessmentQuestion.update({
				where: { id: dto.id },
				data: payload,
				include: { answers: true, proficiencyLevel: true },
			})
		} else {
			question = await this.prisma.assessmentQuestion.create({
				data: payload as Prisma.AssessmentQuestionCreateInput,
				include: { answers: true, proficiencyLevel: true },
			})
		}

		return mapQuestionModelToAdminQuestionDto(question)
	}

	private async replaceImage(
		oldKey: string | null | undefined,
		file: Express.Multer.File,
		levelCode: LEVEL_CODE,
	): Promise<string> {
		// 1) delete old image if exists
		if (oldKey) {
			await this.s3.delete(oldKey)
		}

		// 2) generate new key with proper folder structure
		const ext = extname(file.originalname)
		const hashedName = `${uuid()}${ext}`
		const key = `${this.assessmentFolder}/${levelCode}/${hashedName}`

		// 3) upload new image - use the full key as filename
		await this.s3.uploadImage(key, file.buffer, file.mimetype)

		return key
	}

	private buildQuestionPayload(
		dto: UpsertQuestionDto,
		imageKey?: string,
	): Prisma.AssessmentQuestionCreateInput | Prisma.AssessmentQuestionUpdateInput {
		// Shared payload bits
		const base = {
			proficiencyLevel: { connect: { id: dto.proficiencyLevelId } },
			...(imageKey !== undefined ? { image_key: imageKey } : {}),
		}

		// CREATE mode: no dto.id → early return
		if (!dto.id) {
			return {
				...base,
				question: dto.question,
				answers: {
					create: dto.answers.map(({ answer, isCorrect }) => ({
						answer,
						isCorrect,
					})),
				},
			}
		}

		// UPDATE mode: dto.id is truthy
		const keepIds = dto.answers.filter(a => a.id).map(a => a.id!) // definitely non-null here

		return {
			...base,
			// note: update needs `{ set: ... }`
			question: { set: dto.question },
			answers: {
				deleteMany: { questionId: dto.id, NOT: { id: { in: keepIds } } },
				upsert: dto.answers.map(({ id, answer, isCorrect }) => ({
					where: { id: id ?? 0 },
					create: { answer, isCorrect },
					update: { answer, isCorrect },
				})),
			},
		}
	}

	/** DELETE /assessment-test/questions/:id */
	async deleteQuestion(id: number): Promise<void> {
		await this.prisma.assessmentAnswer.deleteMany({ where: { questionId: id } })
		await this.prisma.assessmentQuestion.delete({ where: { id } })
	}

	/** GET /assessment/questions (?Filters) **/
	async getAllQuestions(
		filter: AssessmentTestAdminFilter,
	): Promise<PaginatedResponse<AssessmentQuestionDto>> {
		const where: Prisma.AssessmentQuestionWhereInput = {}
		if (filter.proficiencyLevelId) {
			where.proficiencyLevelId = filter.proficiencyLevelId
		}
		if (filter.search) {
			where.OR = [
				{ question: { contains: filter.search, mode: 'insensitive' } },
				{ answers: { some: { answer: { contains: filter.search, mode: 'insensitive' } } } },
			]
		}

		const pageData = await paginatePrisma(
			this.prisma.assessmentQuestion,
			{
				where,
				orderBy: { createdAt: 'desc' },
				include: {
					answers: true,
					proficiencyLevel: true,
				},
			},
			this.prisma.assessmentQuestion,
			{
				where,
			},
			{
				page: filter.page,
				pageSize: filter.pageSize,
				disablePagination: filter.disablePagination,
			},
		)

		return mapPaginatedResponse(pageData, mapQuestionModelToAdminQuestionDto)
	}

	async getQuestionById(id: number): Promise<AdminAssessmentQuestionDto> {
		const question = await this.prisma.assessmentQuestion.findUnique({
			where: { id },
			include: {
				answers: true,
				proficiencyLevel: true,
			},
		})

		if (!question) {
			throw new NotFoundException(`Question with ID ${id} not found`)
		}

		console.log('QUEEESTION', question)

		return mapQuestionModelToAdminQuestionDto(question)
	}
}
