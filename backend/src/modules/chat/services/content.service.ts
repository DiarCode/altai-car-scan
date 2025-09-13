import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { APPROVAL_STATUS, EXERCISE_TYPE, NATIVE_LANGUAGE, Prisma } from '@prisma/client'
import { applyTranslation } from 'src/modules/translations/utils/translations-mapper.util'
import { InterestSegmentDto, SegmentDetailDto } from 'src/modules/segments/dtos/segments.dtos'
import {
	ClozeExerciseDto,
	DictationExerciseDto,
	ExerciseDto,
	FlashcardExerciseDto,
	ListeningQuizExerciseDto,
	MultipleChoiceExerciseDto,
	PictureDescriptionExerciseDto,
	PronunciationExerciseDto,
	SentenceReorderExerciseDto,
} from 'src/modules/exercises/dtos/exercises.dtos'
import { ModulesFilter, ModuleSummaryDto } from 'src/modules/modules/dtos/modules.dtos'
import {
	toInterestSegmentDto,
	toSegmentDetailDto,
} from 'src/modules/segments/utils/segments.mapper'
import { mapToFullExerciseDto } from 'src/modules/exercises/utils/exercises.mapper'
import { toModuleSummary } from 'src/modules/modules/utils/modules.mapper'
import { log } from 'console'
import { ModuleDto } from '../dtos/chat.dtos'
import { ChatFlowState } from '../types/chat-flow.types'
import { ChatSessionService } from './chat-session.service'
import { ChatSessionDocument } from '../schemas/chat-session.schema'
import { ModuleWithRelations } from 'src/modules/modules/utils/modules.mapper' // Import ModuleWithRelations

@Injectable()
export class ContentService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly chatSessionService: ChatSessionService,
	) {}

	private async getLearnerAssignedLevelId(learnerId: number): Promise<number> {
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { assignedLevelId: true },
		})
		if (!learner || !learner.assignedLevelId) {
			throw new NotFoundException(`Learner ${learnerId} not found or has no assigned level`)
		}
		return learner.assignedLevelId
	}

	private async mapModuleToDtoWithCompletionStatus(
		learnerId: number,
		module: ModuleWithRelations, // Use the correct type here
	): Promise<ModuleDto> {
		const chatSession = await this.chatSessionService.getSessionByModuleIdAndState(
			learnerId,
			module.id,
			ChatFlowState.MODULE_COMPLETE,
		)
		const isCompleted = !!chatSession
		return {
			...toModuleSummary(module),
			isCompleted,
		}
	}

	async getModuleForLearnerWithCompletionStatus(
		learnerId: number,
		moduleId: number,
	): Promise<ModuleDto> {
		const module = await this.prisma.module.findUnique({
			where: { id: moduleId },
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
		})
		if (!module) {
			throw new NotFoundException(`Module ${moduleId} not found`)
		}
		return this.mapModuleToDtoWithCompletionStatus(learnerId, module)
	}

	async getFirstApprovedModuleForLearner(learnerId: number): Promise<ModuleDto> {
		const assignedLevelId = await this.getLearnerAssignedLevelId(learnerId)

		const module = await this.prisma.module.findFirst({
			where: {
				proficiencyLevelId: assignedLevelId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'asc' },
		})

		if (!module) {
			throw new NotFoundException('No approved modules found for this learner level.')
		}
		return this.mapModuleToDtoWithCompletionStatus(learnerId, module)
	}

	async getNextApprovedModuleForLearner(
		learnerId: number,
		currentModuleId: number,
	): Promise<ModuleDto | null> {
		const assignedLevelId = await this.getLearnerAssignedLevelId(learnerId)

		const currentModule = await this.prisma.module.findUnique({
			where: { id: currentModuleId },
			select: { order: true },
		})

		if (!currentModule) {
			throw new NotFoundException(`Current module ${currentModuleId} not found.`)
		}

		const nextModule = await this.prisma.module.findFirst({
			where: {
				proficiencyLevelId: assignedLevelId,
				status: APPROVAL_STATUS.PUBLISHED,
				order: { gt: currentModule.order },
			},
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'asc' },
		})

		if (!nextModule) {
			return null // No next module found
		}
		return this.mapModuleToDtoWithCompletionStatus(learnerId, nextModule)
	}

	async getLastApprovedModuleForLearner(learnerId: number): Promise<ModuleDto> {
		const assignedLevelId = await this.getLearnerAssignedLevelId(learnerId)

		const module = await this.prisma.module.findFirst({
			where: {
				proficiencyLevelId: assignedLevelId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'desc' },
		})

		if (!module) {
			throw new NotFoundException('No approved modules found for this learner level.')
		}
		return this.mapModuleToDtoWithCompletionStatus(learnerId, module)
	}

	async getFirstApprovedModuleForProficiencyLevel(
		proficiencyLevelId: number,
	): Promise<ModuleDto | null> {
		const module = await this.prisma.module.findFirst({
			where: {
				proficiencyLevelId: proficiencyLevelId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'asc' },
		})

		if (!module) {
			return null
		}
		// Note: This method doesn't need learnerId for completion status,
		// as it's just finding the first module in a level.
		// The completion status will be determined when the session is created/updated.
		return {
			...toModuleSummary(module),
			isCompleted: false, // Default to false, actual status determined by session
		}
	}

	async getAllModulesList(learnerId: number, query: ModulesFilter): Promise<ModuleDto[]> {
		const where: Prisma.ModuleWhereInput = {
			status: APPROVAL_STATUS.PUBLISHED,
		}

		if (query.search) {
			where.OR = [
				{ title: { contains: query.search, mode: 'insensitive' } },
				{ description: { contains: query.search, mode: 'insensitive' } },
				{ outcomes: { contains: query.search, mode: 'insensitive' } },
			]
		}

		if (query.proficiencyLevelId) {
			where.proficiencyLevelId = query.proficiencyLevelId
		}

		if (query.minTime !== undefined) {
			where.segments = {
				some: {
					timeToComplete: { gte: query.minTime },
				},
			}
		}

		if (query.maxTime !== undefined) {
			where.segments = {
				some: {
					timeToComplete: { lte: query.maxTime },
				},
			}
		}

		if (query.status) {
			where.status = query.status
		}

		const modules = await this.prisma.module.findMany({
			where: where,
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'asc' },
		})

		const moduleIds = modules.map(module => module.id)

		const chatSessions = await this.chatSessionService.findSessionsByModuleIdsAndState(
			learnerId,
			moduleIds,
			ChatFlowState.MODULE_COMPLETE,
		)

		const completedModuleIds = new Set(
			chatSessions.map((session: ChatSessionDocument) => session.learningContext.moduleId),
		)

		return modules.map(module => {
			const isCompleted = completedModuleIds.has(module.id)
			return {
				...toModuleSummary(module),
				isCompleted,
			}
		})
	}

	/**
	 * Get modules for learner with translations applied
	 */
	async getModulesForLearner(learnerId: number): Promise<ModuleDto[]> {
		// Get learner's assigned level
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { assignedLevelId: true },
		})
		if (!learner) {
			throw new NotFoundException(`Learner ${learnerId} not found`)
		}

		// Get modules for learner's level
		const modules = await this.prisma.module.findMany({
			where: {
				proficiencyLevelId: learner.assignedLevelId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
			orderBy: { order: 'asc' },
		})

		const moduleIds = modules.map(module => module.id)

		const chatSessions = await this.chatSessionService.findSessionsByModuleIdsAndState(
			learnerId,
			moduleIds,
			ChatFlowState.MODULE_COMPLETE,
		)

		const completedModuleIds = new Set(
			chatSessions.map((session: ChatSessionDocument) => session.learningContext.moduleId),
		)

		return modules.map(module => {
			const isCompleted = completedModuleIds.has(module.id)
			return {
				...toModuleSummary(module),
				isCompleted,
			}
		})
	}

	async getModuleById(moduleId: number): Promise<ModuleSummaryDto> {
		const module = await this.prisma.module.findUnique({
			where: { id: moduleId },
			include: {
				proficiencyLevel: {
					select: {
						id: true,
						code: true,
						title: true,
						description: true,
					},
				},
				segments: {
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
		})
		if (!module) {
			throw new NotFoundException(`Module ${moduleId} not found`)
		}
		return toModuleSummary(module)
	}

	async getSegmentIdsForModule(moduleId: number): Promise<number[]> {
		const segments = await this.prisma.segment.findMany({
			where: {
				moduleId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			select: {
				id: true,
			},
			orderBy: {
				order: 'asc',
			},
		})
		log('segments:', segments.length)
		return segments.map(segment => segment.id)
	}

	/**
	 * Get detailed segment for learner with translations
	 */
	async getSegmentDetailForLearner(
		segmentId: number,
		learnerLanguage: NATIVE_LANGUAGE,
	): Promise<SegmentDetailDto> {
		// Fetch segment with all related data
		const segment = await this.prisma.segment.findUnique({
			where: { id: segmentId },
			include: {
				module: {
					select: {
						id: true,
						title: true,
						theoryContent: true,
						description: true,
						order: true,
						outcomes: true,
						status: true,
						proficiencyLevel: {
							select: {
								id: true,
								code: true,
								title: true,
								description: true,
							},
						},
					},
				},
				interestSegments: {
					include: {
						InterestSegmentTranslation: learnerLanguage !== NATIVE_LANGUAGE.KAZAKH,
					},
				},
				SegmentTranslation: learnerLanguage !== NATIVE_LANGUAGE.KAZAKH,
			},
		})

		if (!segment) {
			throw new NotFoundException(`Segment ${segmentId} not found`)
		}

		// Convert to base DTO
		const baseSegmentDetail = toSegmentDetailDto(segment)

		// Skip translation for Kazakh speakers
		if (learnerLanguage === NATIVE_LANGUAGE.KAZAKH) {
			return baseSegmentDetail
		}

		// Apply segment translation (title, etc.)
		const segmentWithTranslation = applyTranslation(
			baseSegmentDetail,
			segment.SegmentTranslation || [],
			learnerLanguage,
		)

		// Apply translations to interest segments if they exist
		if (segmentWithTranslation.interestSegments) {
			segmentWithTranslation.interestSegments = segmentWithTranslation.interestSegments.map(
				interestSeg => {
					const matchingSegment = segment.interestSegments.find(is => is.id === interestSeg.id)
					if (matchingSegment?.InterestSegmentTranslation) {
						return applyTranslation(
							interestSeg,
							matchingSegment.InterestSegmentTranslation,
							learnerLanguage,
						)
					}
					return interestSeg
				},
			)
		}

		return segmentWithTranslation
	}

	/**
	 * Get interest segments for learner with translations
	 */
	async getInterestSegmentsForLearner(
		segmentId: number,
		learnerLanguage: NATIVE_LANGUAGE,
	): Promise<InterestSegmentDto[]> {
		const interestSegments = await this.prisma.interestSegment.findMany({
			where: { segmentId },
			include: {
				InterestSegmentTranslation: true,
			},
		})

		return interestSegments.map(interestSegment => {
			const baseInterestSegment = toInterestSegmentDto(interestSegment)

			return applyTranslation(
				baseInterestSegment,
				interestSegment.InterestSegmentTranslation,
				learnerLanguage,
			)
		})
	}

	/**
	 * Get exercises for learner with translations
	 */
	async getExercisesForLearner(
		interestSegmentId: number,
		learnerLanguage: NATIVE_LANGUAGE,
	): Promise<ExerciseDto[]> {
		const exercises = await this.prisma.exercise.findMany({
			where: {
				interestSegmentId,
				status: APPROVAL_STATUS.PUBLISHED,
			},
			include: {
				ExerciseTranslation: true,
			},
			orderBy: { createdAt: 'desc' },
		})

		if (exercises.length === 0) {
			throw new NotFoundException(
				`No exercises found for interest segment ${interestSegmentId}. No content available.`,
			)
		}

		return exercises.map(exercise => {
			// First convert to full DTO
			const baseExercise = mapToFullExerciseDto(exercise)

			// Skip translation for Kazakh speakers
			if (learnerLanguage === NATIVE_LANGUAGE.KAZAKH) {
				return baseExercise
			}

			// Find translation for learner's language
			const translation = exercise.ExerciseTranslation.find(t => t.language === learnerLanguage)

			if (!translation) {
				return baseExercise
			}

			// Apply translation manually based on exercise type
			return this.applyExerciseTranslationForLearner(baseExercise, translation)
		})
	}

	private applyExerciseTranslationForLearner(
		exercise: ExerciseDto,
		translation: { title: string; payload: unknown },
	): ExerciseDto {
		// Apply title translation
		const translatedTitle = translation.title || exercise.title

		// Apply payload translation based on exercise type
		switch (exercise.type) {
			case EXERCISE_TYPE.FLASHCARD: {
				const flashcardPayload = translation.payload as Partial<FlashcardExerciseDto> | undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					cards: flashcardPayload?.cards ?? exercise.cards,
				} as FlashcardExerciseDto
			}

			case EXERCISE_TYPE.CLOZE: {
				const clozePayload = translation.payload as Partial<ClozeExerciseDto> | undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					sentences: clozePayload?.sentences ?? exercise.sentences,
				} as ClozeExerciseDto
			}

			case EXERCISE_TYPE.SENTENCE_REORDER: {
				const reorderPayload = translation.payload as
					| Partial<SentenceReorderExerciseDto>
					| undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					fragments: reorderPayload?.fragments ?? exercise.fragments,
				} as SentenceReorderExerciseDto
			}

			case EXERCISE_TYPE.MULTIPLE_CHOICE: {
				const multipleChoicePayload = translation.payload as
					| Partial<MultipleChoiceExerciseDto>
					| undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					questions: multipleChoicePayload?.questions ?? exercise.questions,
				} as MultipleChoiceExerciseDto
			}

			case EXERCISE_TYPE.DICTATION: {
				const dictationPayload = translation.payload as Partial<DictationExerciseDto> | undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					transcript: dictationPayload?.transcript ?? exercise.transcript,
					audioUrl: dictationPayload?.audioUrl ?? exercise.audioUrl,
				} as DictationExerciseDto
			}

			case EXERCISE_TYPE.LISTENING_QUIZ: {
				const listeningPayload = translation.payload as
					| Partial<ListeningQuizExerciseDto>
					| undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					questions: listeningPayload?.questions ?? exercise.questions,
				} as ListeningQuizExerciseDto
			}

			case EXERCISE_TYPE.PRONUNCIATION: {
				const pronunciationPayload = translation.payload as
					| Partial<PronunciationExerciseDto>
					| undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					text: pronunciationPayload?.text ?? exercise.text,
					audioUrl: pronunciationPayload?.audioUrl ?? exercise.audioUrl,
				} as PronunciationExerciseDto
			}

			case EXERCISE_TYPE.PICTURE_DESCRIPTION: {
				const picturePayload = translation.payload as
					| Partial<PictureDescriptionExerciseDto>
					| undefined
				return {
					...(exercise as object),
					title: translatedTitle,
					prompt: picturePayload?.prompt ?? exercise.prompt,
					expectedKeywords: picturePayload?.expectedKeywords ?? exercise.expectedKeywords,
					imageUrl: picturePayload?.imageUrl ?? exercise.imageUrl,
				} as PictureDescriptionExerciseDto
			}

			default:
				return {
					...(exercise as object),
					title: translatedTitle,
				} as ExerciseDto
		}
	}

	async getExerciseById(exerciseId: number): Promise<ExerciseDto> {
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: exerciseId },
		})
		if (!exercise) {
			throw new NotFoundException(`Exercise ${exerciseId} not found`)
		}
		return mapToFullExerciseDto(exercise)
	}

	async getExercisesForSegment(segmentId: number): Promise<ExerciseDto[]> {
		const exercises = await this.prisma.exercise.findMany({
			where: {
				interestSegment: {
					segmentId,
				},
				status: APPROVAL_STATUS.PUBLISHED,
			},
		})
		return exercises.map(mapToFullExerciseDto)
	}
}
