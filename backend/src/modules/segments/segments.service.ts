import {
	Injectable,
	NotFoundException,
	Inject,
	Logger,
	InternalServerErrorException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { SegmentsAdapter } from './adapters/segments-adapter.interface'
import {
	BaseSegmentDto,
	GenerateInterestSegmentDto,
	GenerateInterestSegmentsDto,
	GenerateSegmentsDto,
	InterestSegmentDto,
	InterestSegmentsFilter,
	MergeSegmentsDto,
	SegmentDetailDto,
	SegmentsFilter,
	UpdateInterestSegmentDto,
	UpdateSegmentDto,
} from './dtos/segments.dtos'
import {
	toInterestSegmentDto,
	toBaseSegmentDto,
	toSegmentDetailDto,
	isSegmentPopulated,
} from './utils/segments.mapper'
import { PaginatedResponse, DEFAULT_PAGINATION } from 'src/common/utils/pagination.util'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { Prisma, PrismaClient } from '@prisma/client'

@Injectable()
export class SegmentsService {
	private readonly logger = new Logger(SegmentsService.name)

	constructor(
		private readonly prisma: PrismaService,
		@Inject('SegmentsAdapter')
		private readonly adapter: SegmentsAdapter,
	) {}

	async generate(dto: GenerateSegmentsDto): Promise<BaseSegmentDto[]> {
		const mod = await this.prisma.module.findUnique({
			where: { id: dto.moduleId },
			select: { id: true },
		})
		if (!mod) {
			throw new NotFoundException(`Module #${dto.moduleId} not found`)
		}

		const segDefs = await this.adapter.generateSegments(dto.moduleId, dto.count)

		return this.prisma.$transaction(async tx => {
			// Удаляем все существующие сегменты данного модуля
			await tx.segment.deleteMany({ where: { moduleId: dto.moduleId } })

			// Создаём новые сегменты и сразу возвращаем их с включенным module
			const created: BaseSegmentDto[] = []
			for (const def of segDefs) {
				const s = await tx.segment.create({
					data: {
						moduleId: dto.moduleId,
						title: def.title,
						theoryContent: def.theoryContent,
						order: def.order,
						timeToComplete: def.timeToComplete,
						status: def.status,
					},
				})
				created.push(toBaseSegmentDto(s))
			}
			return created
		})
	}

	async findOne(id: number): Promise<SegmentDetailDto> {
		const s = await this.prisma.segment.findUnique({
			where: { id },
			include: {
				module: {
					select: {
						id: true,
						title: true,
						theoryContent: true,
						description: true,
						order: true,
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
					select: {
						id: true,
						segmentId: true,
						theoryContent: true,
						interest: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
		})

		if (!s) {
			throw new NotFoundException(`Segment #${id} not found`)
		}

		if (isSegmentPopulated(s)) {
			return toSegmentDetailDto(s)
		} else {
			// This should never happen unless include was misconfigured
			// But still safe — fallback or log if needed
			throw new InternalServerErrorException('Segment missing expected relations')
		}
	}

	async list(query: SegmentsFilter): Promise<PaginatedResponse<BaseSegmentDto>> {
		const {
			page = DEFAULT_PAGINATION.page,
			pageSize = DEFAULT_PAGINATION.pageSize,
			disablePagination,
			moduleId,
			status,
			search,
		} = query

		const where: Prisma.SegmentWhereInput = {}
		if (moduleId) where.moduleId = moduleId
		if (status) where.status = status
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ theoryContent: { contains: search, mode: 'insensitive' } },
			]
		}

		const pageData = await paginatePrisma(
			this.prisma.segment,
			{
				where,
				orderBy: { order: 'asc' },
			},
			this.prisma.segment,
			{ where },
			{ page, pageSize, disablePagination },
		)

		const data = pageData.data.map(s => toBaseSegmentDto(s))
		return {
			data,
			pagination: pageData.pagination,
		}
	}

	/** Fetches a segment's moduleId & order, or throws 404. */
	private async fetchSegmentMeta(id: number): Promise<{ moduleId: number; order: number }> {
		const existing = await this.prisma.segment.findUnique({
			where: { id },
			select: { moduleId: true, order: true },
		})
		if (!existing) throw new NotFoundException(`Segment #${id} not found`)
		return existing
	}

	/**
	 * Decrements (shifts left) the order of every segment in `moduleId`
	 * whose order is > `thresholdOrder`.
	 */
	private async decrementSegmentOrdersAbove(
		db: PrismaClient,
		moduleId: number,
		thresholdOrder: number,
	): Promise<void> {
		// safe because we delete the removed segment first
		const toShift = await db.segment.findMany({
			where: { moduleId, order: { gt: thresholdOrder } },
			orderBy: { order: 'asc' },
			select: { id: true, order: true },
		})
		for (const seg of toShift) {
			await db.segment.update({
				where: { id: seg.id },
				data: { order: seg.order - 1 },
			})
		}
	}

	/**
	 * Renumbers *all* segments in `moduleId` so their orders become
	 * 1, 2, 3… without colliding on the (moduleId,order) unique constraint.
	 * Uses a two-phase placeholder assignment.
	 */
	private async reorderSegmentsInModule(
		db: Prisma.TransactionClient,
		moduleId: number,
	): Promise<void> {
		const all = await db.segment.findMany({
			where: { moduleId },
			orderBy: { order: 'asc' },
			select: { id: true },
		})

		// Phase 1: assign unique negative placeholders
		for (let i = 0; i < all.length; i++) {
			await db.segment.update({
				where: { id: all[i].id },
				data: { order: -(i + 1) },
			})
		}

		// Phase 2: assign final positive orders
		for (let i = 0; i < all.length; i++) {
			await db.segment.update({
				where: { id: all[i].id },
				data: { order: i + 1 },
			})
		}
	}

	/**
	 * Increments (shifts right) the order of every segment in `moduleId`
	 * whose order is > `startingOrder` by `shiftAmount`, updating
	 * from highest→lowest to avoid unique‐constraint conflicts.
	 */
	private async shiftSegmentOrdersUp(
		tx: Prisma.TransactionClient,
		moduleId: number,
		startingOrder: number,
		shiftAmount: number,
	): Promise<void> {
		const toShift = await tx.segment.findMany({
			where: { moduleId, order: { gt: startingOrder } },
			orderBy: { order: 'desc' },
			select: { id: true, order: true },
		})
		for (const seg of toShift) {
			await tx.segment.update({
				where: { id: seg.id },
				data: { order: seg.order + shiftAmount },
			})
		}
	}

	/**
	 * Merges the given `segmentIds` in a module into one segment,
	 * then re‐orders everything sequentially.
	 */
	async merge(dto: MergeSegmentsDto): Promise<BaseSegmentDto> {
		const { moduleId, segmentIds } = dto

		// 1) Verify existence
		const existing = await this.prisma.segment.findMany({
			where: { id: { in: segmentIds } },
			select: { id: true },
		})
		if (existing.length !== segmentIds.length) {
			throw new NotFoundException('One or more segments not found')
		}

		// 2) Build merged definition
		const [mergedDef] = await this.adapter.mergeSegments(moduleId, segmentIds)

		// 3) Transaction: delete old, create merged, reorder, return DTO
		return this.prisma.$transaction(async tx => {
			// Delete all interest segments for the segments being merged
			await tx.interestSegment.deleteMany({
				where: { segmentId: { in: segmentIds } },
			})

			const originals = await this.prisma.segment.findMany({
				where: { id: { in: segmentIds } },
				select: { order: true },
			})
			const insertAt = Math.min(...originals.map(s => s.order))

			await tx.segment.deleteMany({ where: { id: { in: segmentIds } } })

			await tx.segment.create({
				data: {
					moduleId,
					title: mergedDef.title,
					theoryContent: mergedDef.theoryContent,
					order: insertAt, // placeholder
					timeToComplete: mergedDef.timeToComplete,
					status: mergedDef.status,
				},
			})

			await this.reorderSegmentsInModule(tx, moduleId)

			const merged = await tx.segment.findFirst({
				where: {
					moduleId,
					title: mergedDef.title,
					theoryContent: mergedDef.theoryContent,
					timeToComplete: mergedDef.timeToComplete,
					status: mergedDef.status,
				},
				orderBy: { id: 'desc' },
			})
			if (!merged) {
				throw new NotFoundException('Merged segment not found')
			}
			return toBaseSegmentDto(merged)
		})
	}

	/**
	 * Splits one segment into `count` parts, shifts others right,
	 * inserts new parts at the correct orders, and returns their DTOs.
	 */
	async split(segmentId: number, count = 2): Promise<BaseSegmentDto[]> {
		const { moduleId, order: originalOrder } = await this.fetchSegmentMeta(segmentId)
		const parts = await this.adapter.splitSegments(segmentId, count)
		const shiftAmount = parts.length - 1

		return this.prisma.$transaction(async tx => {
			// delete all interest segments for the original segment
			await tx.interestSegment.deleteMany({
				where: { segmentId },
			})

			// a) Remove the original segment
			await tx.segment.delete({ where: { id: segmentId } })

			// b) Shift existing segments right to make room
			await this.shiftSegmentOrdersUp(tx, moduleId, originalOrder, shiftAmount)

			// c) Insert each new part at its slot
			const created: BaseSegmentDto[] = []
			for (const p of parts) {
				const seg = await tx.segment.create({
					data: {
						moduleId,
						title: p.title,
						theoryContent: p.theoryContent,
						order: originalOrder + (p.order - 1),
						timeToComplete: p.timeToComplete,
						status: p.status,
					},
				})
				created.push(toBaseSegmentDto(seg))
			}
			return created
		})
	}

	/** Updates a segment's non‐ordering fields in place. */
	async update(id: number, dto: UpdateSegmentDto): Promise<BaseSegmentDto> {
		await this.fetchSegmentMeta(id)

		const updated = await this.prisma.segment.update({
			where: { id },
			data: dto,
			include: {
				module: {
					select: {
						id: true,
						title: true,
						theoryContent: true,
						description: true,
						order: true,
						status: true,
						proficiencyLevel: {
							select: { id: true, code: true, title: true, description: true },
						},
					},
				},
			},
		})
		return toBaseSegmentDto(updated)
	}

	/** Deletes a segment and closes the gap by shifting left higher‐order segments. */
	async remove(id: number): Promise<void> {
		const { moduleId, order } = await this.fetchSegmentMeta(id)
		await this.prisma.segment.delete({ where: { id } })
		await this.decrementSegmentOrdersAbove(this.prisma, moduleId, order)
	}

	async generateInterestSegments(dto: GenerateInterestSegmentsDto): Promise<InterestSegmentDto[]> {
		const base = await this.prisma.segment.findUnique({
			where: { id: dto.segmentId },
			select: { id: true },
		})
		if (!base) {
			throw new NotFoundException(`Segment #${dto.segmentId} not found`)
		}

		const segDefs = await this.adapter.generateInterestSegments(dto.segmentId, dto.interests)

		const created = await Promise.all(
			segDefs.map(def =>
				this.prisma.interestSegment.create({
					data: {
						segmentId: dto.segmentId,
						interest: def.interest,
						theoryContent: def.theoryContent,
					},
				}),
			),
		)

		return created.map(toInterestSegmentDto)
	}

	async generateInterestSegment(dto: GenerateInterestSegmentDto): Promise<InterestSegmentDto> {
		const mod = await this.prisma.segment.findUnique({
			where: { id: dto.segmentId },
			select: { id: true },
		})
		if (!mod) {
			throw new NotFoundException(`Segment #${dto.segmentId} not found`)
		}
		const segDef = await this.adapter.generateInterestSegment(dto.segmentId, dto.interest)
		const created = await this.prisma.interestSegment.create({
			data: {
				segmentId: dto.segmentId,
				theoryContent: segDef.theoryContent,
				interest: segDef.interest,
			},
		})
		return toInterestSegmentDto(created)
	}

	async listInterestSegments(
		query: InterestSegmentsFilter,
	): Promise<PaginatedResponse<InterestSegmentDto>> {
		const {
			page = DEFAULT_PAGINATION.page,
			pageSize = DEFAULT_PAGINATION.pageSize,
			disablePagination,
			segmentId,
			interest,
		} = query

		// Build the “where” clause:
		const where: Prisma.InterestSegmentWhereInput = {}
		if (segmentId) {
			where.segmentId = segmentId
		}
		if (interest) {
			where.interest = interest
		}

		// Use paginatePrisma utility:
		const pageData = await paginatePrisma(
			this.prisma.interestSegment,
			{
				where,
				orderBy: { id: 'asc' },
			},
			this.prisma.interestSegment,
			{ where },
			{ page, pageSize, disablePagination },
		)

		const data = pageData.data.map(s => toInterestSegmentDto(s))

		return {
			data,
			pagination: pageData.pagination,
		}
	}

	async findInterestSegment(id: number): Promise<InterestSegmentDto> {
		const s = await this.prisma.interestSegment.findUnique({
			where: { id },
		})

		if (!s) throw new NotFoundException(`InterestSegment #${id} not found`)
		return toInterestSegmentDto(s)
	}

	async updateInterestSegment(
		id: number,
		dto: UpdateInterestSegmentDto,
	): Promise<InterestSegmentDto> {
		await this.findInterestSegment(id)

		const updated = await this.prisma.interestSegment.update({
			where: { id },
			data: {
				// Only update the fields passed in the DTO:
				...(dto.interest !== undefined ? { interest: dto.interest } : {}),
				...(dto.theoryContent !== undefined ? { theoryContent: dto.theoryContent } : {}),
			},
		})

		return toInterestSegmentDto(updated)
	}

	async removeInterestSegment(id: number): Promise<void> {
		await this.findInterestSegment(id)
		await this.prisma.interestSegment.delete({ where: { id } })
	}
}
