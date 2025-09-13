import { Injectable, NotFoundException, ConflictException, Inject, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AssessmentAnswerTranslation, NATIVE_LANGUAGE, Prisma } from '@prisma/client'
import { TranslationsAdapter } from './adapter/translations-adapter.interface'
import {
	CreateSegmentTranslationDto,
	UpdateSegmentTranslationDto,
	CreateInterestSegmentTranslationDto,
	UpdateInterestSegmentTranslationDto,
	CreateExerciseTranslationDto,
	UpdateExerciseTranslationDto,
	SegmentTranslationDto,
	InterestSegmentTranslationDto,
	ExerciseTranslationDto,
	GenerateTranslationsDto,
	TranslationFilter,
	SegmentWithTranslationsDto,
	InterestSegmentWithTranslationsDto,
	ExerciseWithTranslationsDto,
	AssessmentQuestionTranslationDto,
	AssessmentQuestionWithTranslationsDto,
	CreateAssessmentQuestionTranslationDto,
	UpdateAssessmentQuestionTranslationDto,
} from './dtos/translations.dtos'
import {
	toSegmentTranslationDto,
	toInterestSegmentTranslationDto,
	toExerciseTranslationDto,
	toSegmentWithTranslationsDto,
	toInterestSegmentWithTranslationsDto,
	toExerciseWithTranslationsDto,
	toAssessmentQuestionTranslationDto,
	toAssessmentQuestionWithTranslationsDto,
} from './utils/translations-mapper.util'

@Injectable()
export class TranslationsService {
	private readonly logger = new Logger(TranslationsService.name)

	constructor(
		private readonly prisma: PrismaService,
		@Inject('TranslationsAdapter')
		private readonly adapter: TranslationsAdapter,
	) {}

	// Segment Translations
	async createSegmentTranslation(dto: CreateSegmentTranslationDto): Promise<SegmentTranslationDto> {
		// Check if segment exists
		const segment = await this.prisma.segment.findUnique({
			where: { id: dto.segmentId },
		})
		if (!segment) {
			throw new NotFoundException(`Segment ${dto.segmentId} not found`)
		}

		// Check for existing translation
		const existing = await this.prisma.segmentTranslation.findUnique({
			where: {
				segmentId_language: {
					segmentId: dto.segmentId,
					language: dto.language,
				},
			},
		})
		if (existing) {
			throw new ConflictException(
				`Translation for segment ${dto.segmentId} in ${dto.language} already exists`,
			)
		}

		// Use provided content or generate via AI
		let title = dto.title
		let theoryContent = dto.theoryContent

		if (!title || !theoryContent) {
			const generated = await this.adapter.translateSegment(dto.segmentId, dto.language)
			title = title || generated.title
			theoryContent = theoryContent || generated.theoryContent
		}

		const created = await this.prisma.segmentTranslation.create({
			data: {
				segmentId: dto.segmentId,
				language: dto.language,
				title,
				theoryContent,
			},
		})

		return toSegmentTranslationDto(created)
	}

	async updateSegmentTranslation(
		id: number,
		dto: UpdateSegmentTranslationDto,
	): Promise<SegmentTranslationDto> {
		const updated = await this.prisma.segmentTranslation.update({
			where: { id },
			data: dto,
		})
		return toSegmentTranslationDto(updated)
	}

	async deleteSegmentTranslation(id: number): Promise<void> {
		await this.prisma.segmentTranslation.delete({
			where: { id },
		})
	}

	async getSegmentTranslations(
		segmentId: number,
		filter?: TranslationFilter,
	): Promise<SegmentTranslationDto[]> {
		const where: Prisma.SegmentTranslationWhereInput = {
			segmentId,
			...(filter?.language && { language: filter.language }),
		}

		const translations = await this.prisma.segmentTranslation.findMany({
			where,
			orderBy: { language: 'asc' },
		})

		return translations.map(toSegmentTranslationDto)
	}

	async getSegmentWithTranslations(segmentId: number): Promise<SegmentWithTranslationsDto> {
		const segment = await this.prisma.segment.findUnique({
			where: { id: segmentId },
			include: {
				SegmentTranslation: true,
			},
		})

		if (!segment) {
			throw new NotFoundException(`Segment ${segmentId} not found`)
		}

		return toSegmentWithTranslationsDto(segment)
	}

	// Interest Segment Translations
	async createInterestSegmentTranslation(
		dto: CreateInterestSegmentTranslationDto,
	): Promise<InterestSegmentTranslationDto> {
		// Check if interest segment exists
		const interestSegment = await this.prisma.interestSegment.findUnique({
			where: { id: dto.interestSegmentId },
		})
		if (!interestSegment) {
			throw new NotFoundException(`InterestSegment ${dto.interestSegmentId} not found`)
		}

		// Check for existing translation
		const existing = await this.prisma.interestSegmentTranslation.findUnique({
			where: {
				interestSegmentId_language: {
					interestSegmentId: dto.interestSegmentId,
					language: dto.language,
				},
			},
		})
		if (existing) {
			throw new ConflictException(
				`Translation for interest segment ${dto.interestSegmentId} in ${dto.language} already exists`,
			)
		}

		// Use provided content or generate via AI
		let theoryContent = dto.theoryContent

		if (!theoryContent) {
			const generated = await this.adapter.translateInterestSegment(
				dto.interestSegmentId,
				dto.language,
			)
			theoryContent = generated.theoryContent
		}

		const created = await this.prisma.interestSegmentTranslation.create({
			data: {
				interestSegmentId: dto.interestSegmentId,
				language: dto.language,
				theoryContent,
			},
		})

		return toInterestSegmentTranslationDto(created)
	}

	async updateInterestSegmentTranslation(
		id: number,
		dto: UpdateInterestSegmentTranslationDto,
	): Promise<InterestSegmentTranslationDto> {
		const updated = await this.prisma.interestSegmentTranslation.update({
			where: { id },
			data: dto,
		})
		return toInterestSegmentTranslationDto(updated)
	}

	async deleteInterestSegmentTranslation(id: number): Promise<void> {
		await this.prisma.interestSegmentTranslation.delete({
			where: { id },
		})
	}

	async getInterestSegmentTranslations(
		interestSegmentId: number,
		filter?: TranslationFilter,
	): Promise<InterestSegmentTranslationDto[]> {
		const where: Prisma.InterestSegmentTranslationWhereInput = {
			interestSegmentId,
			...(filter?.language && { language: filter.language }),
		}

		const translations = await this.prisma.interestSegmentTranslation.findMany({
			where,
			orderBy: { language: 'asc' },
		})

		return translations.map(toInterestSegmentTranslationDto)
	}

	async getInterestSegmentWithTranslations(
		interestSegmentId: number,
	): Promise<InterestSegmentWithTranslationsDto> {
		const interestSegment = await this.prisma.interestSegment.findUnique({
			where: { id: interestSegmentId },
			include: {
				InterestSegmentTranslation: true,
			},
		})

		if (!interestSegment) {
			throw new NotFoundException(`InterestSegment ${interestSegmentId} not found`)
		}

		return toInterestSegmentWithTranslationsDto(interestSegment)
	}

	// Exercise Translations
	async createExerciseTranslation(
		dto: CreateExerciseTranslationDto,
	): Promise<ExerciseTranslationDto> {
		// Check if exercise exists
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: dto.exerciseId },
		})
		if (!exercise) {
			throw new NotFoundException(`Exercise ${dto.exerciseId} not found`)
		}

		// Check for existing translation
		const existing = await this.prisma.exerciseTranslation.findUnique({
			where: {
				exerciseId_language: {
					exerciseId: dto.exerciseId,
					language: dto.language,
				},
			},
		})
		if (existing) {
			throw new ConflictException(
				`Translation for exercise ${dto.exerciseId} in ${dto.language} already exists`,
			)
		}

		// Use provided content or generate via AI
		let title = dto.title
		let payload = dto.payload

		if (!title || !payload) {
			const generated = await this.adapter.translateExercise(dto.exerciseId, dto.language)
			title = title || generated.title
			payload = payload || generated.payload
		}

		const created = await this.prisma.exerciseTranslation.create({
			data: {
				exerciseId: dto.exerciseId,
				language: dto.language,
				title,
				payload: payload as unknown as Prisma.InputJsonValue,
			},
		})

		return toExerciseTranslationDto(created)
	}

	async updateExerciseTranslation(
		id: number,
		dto: UpdateExerciseTranslationDto,
	): Promise<ExerciseTranslationDto> {
		const data: Prisma.ExerciseTranslationUpdateInput = {}

		if (dto.title !== undefined) {
			data.title = dto.title
		}

		if (dto.payload !== undefined) {
			data.payload = dto.payload as unknown as Prisma.InputJsonValue
		}

		const updated = await this.prisma.exerciseTranslation.update({
			where: { id },
			data,
		})

		return toExerciseTranslationDto(updated)
	}

	async deleteExerciseTranslation(id: number): Promise<void> {
		await this.prisma.exerciseTranslation.delete({
			where: { id },
		})
	}

	async getExerciseTranslations(
		exerciseId: number,
		filter?: TranslationFilter,
	): Promise<ExerciseTranslationDto[]> {
		const where: Prisma.ExerciseTranslationWhereInput = {
			exerciseId,
			...(filter?.language && { language: filter.language }),
		}

		const translations = await this.prisma.exerciseTranslation.findMany({
			where,
			orderBy: { language: 'asc' },
		})

		return translations.map(toExerciseTranslationDto)
	}

	async getExerciseWithTranslations(exerciseId: number): Promise<ExerciseWithTranslationsDto> {
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: exerciseId },
			include: {
				ExerciseTranslation: true,
			},
		})

		if (!exercise) {
			throw new NotFoundException(`Exercise ${exerciseId} not found`)
		}

		return toExerciseWithTranslationsDto(exercise)
	}

	// Bulk translation generation
	async generateSegmentTranslations(
		segmentId: number,
		dto: GenerateTranslationsDto,
	): Promise<SegmentTranslationDto[]> {
		const results: SegmentTranslationDto[] = []

		for (const language of dto.languages) {
			if (language === NATIVE_LANGUAGE.KAZAKH) {
				continue // Skip source language
			}

			try {
				const result = await this.createSegmentTranslation({
					segmentId,
					language,
				})
				results.push(result)
			} catch (error) {
				if (error instanceof ConflictException) {
					this.logger.warn(`Translation already exists for segment ${segmentId} in ${language}`)
				} else {
					this.logger.error(
						`Failed to generate translation for segment ${segmentId} in ${language}`,
						error,
					)
				}
			}
		}

		return results
	}

	async generateInterestSegmentTranslations(
		interestSegmentId: number,
		dto: GenerateTranslationsDto,
	): Promise<InterestSegmentTranslationDto[]> {
		const results: InterestSegmentTranslationDto[] = []

		for (const language of dto.languages) {
			if (language === NATIVE_LANGUAGE.KAZAKH) {
				continue // Skip source language
			}

			try {
				const result = await this.createInterestSegmentTranslation({
					interestSegmentId,
					language,
				})
				results.push(result)
			} catch (error) {
				if (error instanceof ConflictException) {
					this.logger.warn(
						`Translation already exists for interest segment ${interestSegmentId} in ${language}`,
					)
				} else {
					this.logger.error(
						`Failed to generate translation for interest segment ${interestSegmentId} in ${language}`,
						error,
					)
				}
			}
		}

		return results
	}

	async generateExerciseTranslations(
		exerciseId: number,
		dto: GenerateTranslationsDto,
	): Promise<ExerciseTranslationDto[]> {
		const results: ExerciseTranslationDto[] = []

		for (const language of dto.languages) {
			if (language === NATIVE_LANGUAGE.KAZAKH) {
				continue // Skip source language
			}

			try {
				const result = await this.createExerciseTranslation({
					exerciseId,
					language,
				})
				results.push(result)
			} catch (error) {
				if (error instanceof ConflictException) {
					this.logger.warn(`Translation already exists for exercise ${exerciseId} in ${language}`)
				} else {
					this.logger.error(
						`Failed to generate translation for exercise ${exerciseId} in ${language}`,
						error,
					)
				}
			}
		}

		return results
	}

	// Assessment Question Translations (with answers)
	async createAssessmentQuestionTranslation(
		dto: CreateAssessmentQuestionTranslationDto,
	): Promise<AssessmentQuestionTranslationDto> {
		// Check if question exists
		const question = await this.prisma.assessmentQuestion.findUnique({
			where: { id: dto.questionId },
			include: { answers: true },
		})
		if (!question) {
			throw new NotFoundException(`AssessmentQuestion ${dto.questionId} not found`)
		}

		// Check for existing translation
		const existing = await this.prisma.assessmentQuestionTranslation.findUnique({
			where: {
				questionId_language: {
					questionId: dto.questionId,
					language: dto.language,
				},
			},
		})
		if (existing) {
			throw new ConflictException(
				`Translation for assessment question ${dto.questionId} in ${dto.language} already exists`,
			)
		}

		// Generate question + answers translation via AI
		const generated = await this.adapter.translateAssessmentQuestion(dto.questionId, dto.language)

		// Create question translation and all answer translations in a transaction
		return await this.prisma.$transaction(async tx => {
			// Create question translation
			const questionTranslation = await tx.assessmentQuestionTranslation.create({
				data: {
					questionId: dto.questionId,
					language: dto.language,
					question: generated.question,
				},
			})

			// Create answer translations
			const answerTranslations: AssessmentAnswerTranslation[] = []
			for (let i = 0; i < question.answers.length; i++) {
				const answer = question.answers[i]
				const translatedAnswer = generated.answers[i]

				// Skip if translation already exists
				const existingAnswerTranslation = await tx.assessmentAnswerTranslation.findUnique({
					where: {
						answerId_language: {
							answerId: answer.id,
							language: dto.language,
						},
					},
				})

				if (!existingAnswerTranslation && translatedAnswer) {
					const answerTranslation = await tx.assessmentAnswerTranslation.create({
						data: {
							answerId: answer.id,
							language: dto.language,
							answer: translatedAnswer.answer,
						},
					})
					answerTranslations.push(answerTranslation)
				}
			}

			return toAssessmentQuestionTranslationDto(questionTranslation, answerTranslations)
		})
	}

	async updateAssessmentQuestionTranslation(
		id: number,
		dto: UpdateAssessmentQuestionTranslationDto,
	): Promise<AssessmentQuestionTranslationDto> {
		return await this.prisma.$transaction(async tx => {
			// Update question translation
			const updated = await tx.assessmentQuestionTranslation.update({
				where: { id },
				data: {
					...(dto.question && { question: dto.question }),
				},
			})

			// Update answer translations if provided
			const answerTranslations: AssessmentAnswerTranslation[] = []
			if (dto.answerTranslations) {
				for (const answerUpdate of dto.answerTranslations) {
					const answerTranslation = await tx.assessmentAnswerTranslation.update({
						where: {
							answerId_language: {
								answerId: answerUpdate.answerId,
								language: updated.language,
							},
						},
						data: {
							answer: answerUpdate.answer,
						},
					})
					answerTranslations.push(answerTranslation)
				}
			} else {
				// If no answer updates provided, fetch existing ones
				const existingAnswerTranslations = await tx.assessmentAnswerTranslation.findMany({
					where: {
						language: updated.language,
						assessmentAnswer: {
							questionId: updated.questionId,
						},
					},
				})
				answerTranslations.push(...existingAnswerTranslations)
			}

			return toAssessmentQuestionTranslationDto(updated, answerTranslations)
		})
	}

	async deleteAssessmentQuestionTranslation(id: number): Promise<void> {
		// Get the question translation to find related answers
		const questionTranslation = await this.prisma.assessmentQuestionTranslation.findUnique({
			where: { id },
			include: {
				assessmentQuestion: {
					include: { answers: true },
				},
			},
		})

		if (!questionTranslation) {
			throw new NotFoundException(`Assessment question translation ${id} not found`)
		}

		// Delete question translation and related answer translations in transaction
		await this.prisma.$transaction(async tx => {
			// Delete answer translations
			const answerIds = questionTranslation.assessmentQuestion.answers.map(a => a.id)
			await tx.assessmentAnswerTranslation.deleteMany({
				where: {
					answerId: { in: answerIds },
					language: questionTranslation.language,
				},
			})

			// Delete question translation
			await tx.assessmentQuestionTranslation.delete({
				where: { id },
			})
		})
	}

	async getAssessmentQuestionTranslations(
		questionId: number,
		filter?: TranslationFilter,
	): Promise<AssessmentQuestionTranslationDto[]> {
		const where: Prisma.AssessmentQuestionTranslationWhereInput = {
			questionId,
			...(filter?.language && { language: filter.language }),
		}

		const translations = await this.prisma.assessmentQuestionTranslation.findMany({
			where,
			orderBy: { language: 'asc' },
		})

		// Fetch related answer translations for each question translation
		const enrichedTranslations: AssessmentQuestionTranslationDto[] = []
		for (const translation of translations) {
			const answerTranslations = await this.prisma.assessmentAnswerTranslation.findMany({
				where: {
					language: translation.language,
					assessmentAnswer: {
						questionId: translation.questionId,
					},
				},
			})
			enrichedTranslations.push(toAssessmentQuestionTranslationDto(translation, answerTranslations))
		}

		return enrichedTranslations
	}

	async getAssessmentQuestionWithTranslations(
		questionId: number,
	): Promise<AssessmentQuestionWithTranslationsDto> {
		const question = await this.prisma.assessmentQuestion.findUnique({
			where: { id: questionId },
			include: {
				answers: {
					include: {
						AssessmentAnswerTranslation: true,
					},
				},
				AssessmentQuestionTranslation: true,
			},
		})

		if (!question) {
			throw new NotFoundException(`AssessmentQuestion ${questionId} not found`)
		}

		return toAssessmentQuestionWithTranslationsDto(question)
	}

	// Bulk translation generation for assessments
	async generateAssessmentQuestionTranslations(
		questionId: number,
		dto: GenerateTranslationsDto,
	): Promise<AssessmentQuestionTranslationDto[]> {
		const results: AssessmentQuestionTranslationDto[] = []

		for (const language of dto.languages) {
			if (language === NATIVE_LANGUAGE.KAZAKH) {
				continue // Skip source language
			}

			try {
				const result = await this.createAssessmentQuestionTranslation({
					questionId,
					language,
				})
				results.push(result)
			} catch (error) {
				if (error instanceof ConflictException) {
					this.logger.warn(
						`Translation already exists for assessment question ${questionId} in ${language}`,
					)
				} else {
					this.logger.error(
						`Failed to generate translation for assessment question ${questionId} in ${language}`,
						error,
					)
				}
			}
		}

		return results
	}
}
