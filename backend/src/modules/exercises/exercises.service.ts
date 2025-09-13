import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { EXERCISE_TYPE, Prisma } from '@prisma/client'
import { ExercisesAdapter } from './adapters/exercise-adapter.interface'
import { mapToBaseExerciseDto, mapToFullExerciseDto } from './utils/exercises.mapper'
import {
	GenerateExerciseDto,
	ExerciseDto,
	BaseExerciseDto,
	ExercisesFilter,
	UpdateExerciseDto,
	ChangeExerciseStatusDto,
} from './dtos/exercises.dtos'
import { isAdapterExerciseDto } from './adapters/exercise-types.guards'
import { PaginatedResponse, DEFAULT_PAGINATION } from 'src/common/utils/pagination.util'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { payloadValidators } from './utils/exercise-type.validator'
import { ImageService } from './media/image.service'
import { AudioService } from './media/audio.service'
import {
	DictationPayload,
	FlashcardPayload,
	ListeningQuizPayload,
	PictureDescriptionPayload,
	PronunciationPayload,
} from './dtos/exercise-payload.types'
import { MediaUrlService } from 'src/common/services/media-url.service'
import { validateAudio, validateImage } from './utils/exercise-media-type.validator'

@Injectable()
export class ExercisesService {
	constructor(
		private readonly prisma: PrismaService,
		@Inject('ExercisesAdapter')
		private readonly adapter: ExercisesAdapter,
		private readonly imageService: ImageService,
		private readonly audioService: AudioService,
	) {}

	/** POST /exercises/generate */
	async generateExercises(input: GenerateExerciseDto): Promise<ExerciseDto[]> {
		const { interestSegmentId, type } = input
		const aiDtos = await this.adapter.generateExercise(interestSegmentId, type)

		const creations = aiDtos.map(dto =>
			this.prisma.exercise.create({
				data: {
					interestSegmentId,
					type: dto.type,
					title: dto.title,
					payload: isAdapterExerciseDto(dto, dto.type)
						? this.toInputJsonValue(structuredClone(dto.payload))
						: Prisma.JsonNull,
				},
			}),
		)
		const records = await this.prisma.$transaction(creations)

		return records.map(mapToFullExerciseDto)
	}

	/** GET /exercises?interestSegmentId=... */
	async listExercises(query: ExercisesFilter): Promise<PaginatedResponse<BaseExerciseDto>> {
		const {
			page = DEFAULT_PAGINATION.page,
			pageSize = DEFAULT_PAGINATION.pageSize,
			disablePagination,
			interestSegmentId,
			type,
		} = query

		// Build dynamic WHERE clause
		const where: Prisma.ExerciseWhereInput = {}
		if (interestSegmentId) where.interestSegmentId = interestSegmentId
		if (type) where.type = type

		const pageData = await paginatePrisma(
			this.prisma.exercise,
			{
				where,
				// New sort: newest first
				orderBy: { createdAt: 'desc' },
			},
			this.prisma.exercise,
			{ where },
			{ page, pageSize, disablePagination },
		)

		const data = pageData.data.map(mapToBaseExerciseDto)
		return {
			data,
			pagination: pageData.pagination,
		}
	}

	/** GET /exercises/:id */
	async getExerciseById(id: number): Promise<ExerciseDto> {
		const record = await this.prisma.exercise.findUnique({
			where: { id },
		})
		if (!record) {
			throw new NotFoundException(`Exercise ${id} not found`)
		}
		return mapToFullExerciseDto(record)
	}

	private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
		return value as Prisma.InputJsonValue
	}

	async deleteExercise(id: number): Promise<void> {
		const { count } = await this.prisma.exercise.deleteMany({
			where: { id },
		})
		if (count === 0) {
			throw new NotFoundException(`Exercise ${id} not found`)
		}
	}

	async changeStatus(id: number, { status }: ChangeExerciseStatusDto): Promise<ExerciseDto> {
		const { count } = await this.prisma.exercise.updateMany({
			where: { id },
			data: { status },
		})
		if (count === 0) {
			throw new NotFoundException(`Exercise ${id} not found`)
		}

		const updated = await this.prisma.exercise.findUnique({ where: { id } })
		return mapToFullExerciseDto(updated!)
	}

	/** PATCH /exercises/:id */
	async updateExercise(id: number, input: UpdateExerciseDto, files: Express.Multer.File[]) {
		const existing = await this.prisma.exercise.findUnique({ where: { id } })
		if (!existing) throw new NotFoundException(`Exercise ${id} not found`)

		const type = existing.type
		const payloadWithMedia = await this.attachMediaToPayload(id, type, input.payload, files)

		const validator = payloadValidators[type]
		if (!validator(payloadWithMedia)) {
			throw new BadRequestException(`Invalid ${type} payload`)
		}

		const validatedPayload = JSON.parse(JSON.stringify(payloadWithMedia)) as Prisma.InputJsonValue
		const data: Prisma.ExerciseUpdateInput = {
			...(input.title && { title: input.title }),
			...(input.status && { status: input.status }),
			payload: validatedPayload,
		}

		const updated = await this.prisma.exercise.update({ where: { id }, data })
		return mapToFullExerciseDto(updated)
	}

	private async attachMediaToPayload(
		id: number,
		type: EXERCISE_TYPE,
		payload: unknown,
		files: Express.Multer.File[],
	): Promise<unknown> {
		if (!files?.length) return payload

		const mapField = (field: string): Express.Multer.File | undefined =>
			files.find(f => f.fieldname === field)

		const buildKey = (suffix: string) => `${type.toLowerCase()}/${id}-${suffix}`

		switch (type) {
			case EXERCISE_TYPE.FLASHCARD: {
				const { cards } = payload as FlashcardPayload
				const updatedCards = await Promise.all(
					cards.map(async (card, i) => ({
						...card,
						imageUrl: await this.maybeUploadImage(
							mapField(`cards[${i}].image`),
							buildKey(`card${i}`),
							card.imageUrl,
						),
						audioUrl: await this.maybeUploadAudio(
							mapField(`cards[${i}].audio`),
							buildKey(`card${i}`),
							card.audioUrl,
						),
					})),
				)
				return { cards: updatedCards }
			}

			case EXERCISE_TYPE.DICTATION:
			case EXERCISE_TYPE.PRONUNCIATION: {
				const audioFile = mapField('audio')
				const existing = payload as DictationPayload | PronunciationPayload
				return {
					...existing,
					audioUrl: await this.maybeUploadAudio(audioFile, buildKey('audio'), existing.audioUrl),
				}
			}

			case EXERCISE_TYPE.LISTENING_QUIZ: {
				const { questions } = payload as ListeningQuizPayload
				const updatedQuestions = await Promise.all(
					questions.map(async (q, i) => ({
						...q,
						audioUrl: await this.maybeUploadAudio(
							mapField(`questions[${i}].audio`),
							buildKey(`q${i}`),
							q.audioUrl,
						),
					})),
				)
				return { questions: updatedQuestions }
			}

			case EXERCISE_TYPE.PICTURE_DESCRIPTION: {
				const imageFile = mapField('image')
				const existing = payload as PictureDescriptionPayload
				return {
					...existing,
					imageUrl: await this.maybeUploadImage(imageFile, buildKey('image'), existing.imageUrl),
				}
			}

			default:
				return payload
		}
	}

	private async maybeUploadImage(
		file: Express.Multer.File | undefined,
		key: string,
		previousUrl?: string,
	): Promise<string | undefined> {
		if (!file) return previousUrl

		validateImage(file)
		const newUrl = await this.imageService.uploadImage(key, file.buffer)

		if (previousUrl) {
			const prevKey = MediaUrlService.extractKeyFromUrl(previousUrl)
			if (prevKey) await this.imageService.deleteImage(prevKey)
		}

		return newUrl
	}

	private async maybeUploadAudio(
		file: Express.Multer.File | undefined,
		key: string,
		previousUrl?: string,
	): Promise<string | undefined> {
		if (!file) return previousUrl

		validateAudio(file)
		const newUrl = await this.audioService.uploadAudio(key, file.buffer)

		if (previousUrl) {
			const prevKey = MediaUrlService.extractKeyFromUrl(previousUrl)
			if (prevKey) await this.audioService.deleteAudio(prevKey)
		}

		return newUrl
	}
}
