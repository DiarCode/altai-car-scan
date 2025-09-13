import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { DEFAULT_PAGINATION, PaginatedResponse } from 'src/common/utils/pagination.util'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { toModuleSummary } from './utils/modules.mapper'
import {
	CreateModuleDto,
	UpdateModuleDto,
	ModulesFilter,
	ModuleSummaryDto,
} from './dtos/modules.dtos'
import { Prisma, PrismaClient } from '@prisma/client'
import { ReorderSegmentsDto } from '../segments/dtos/segments.dtos'

@Injectable()
export class ModulesService {
	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateModuleDto): Promise<ModuleSummaryDto> {
		const lastModule = await this.prisma.module.findFirst({
			where: { proficiencyLevelId: dto.proficiencyLevelId },
			orderBy: { order: 'desc' },
			select: { order: true },
		})
		const nextOrder = lastModule ? lastModule.order + 1 : 1

		const mod = await this.prisma.module.create({
			data: {
				...dto,
				order: nextOrder,
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
		})

		return toModuleSummary(mod)
	}

	async findOne(id: number): Promise<ModuleSummaryDto> {
		const mod = await this.prisma.module.findUnique({
			where: { id },
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
					orderBy: { order: 'asc' },
					select: {
						id: true,
						timeToComplete: true,
						status: true,
					},
				},
			},
		})
		if (!mod) throw new NotFoundException(`Module #${id} not found`)
		return toModuleSummary(mod)
	}

	private async fetchModuleMeta(
		id: number,
	): Promise<{ proficiencyLevelId: number; order: number }> {
		const existing = await this.prisma.module.findUnique({
			where: { id },
			select: { proficiencyLevelId: true, order: true },
		})
		if (!existing) {
			throw new NotFoundException(`Module #${id} not found`)
		}
		return existing
	}

	/**
	 * Updates only non-order fields when the level hasn't changed.
	 */
	private async updateFieldsWithoutReordering(
		id: number,
		dto: UpdateModuleDto,
	): Promise<ModuleSummaryDto> {
		const updated = await this.prisma.module.update({
			where: { id },
			data: {
				title: dto.title,
				description: dto.description,
				proficiencyLevelId: dto.proficiencyLevelId,
				theoryContent: dto.theoryContent,
				outcomes: dto.outcomes,
				status: dto.status,
			},
			include: {
				proficiencyLevel: {
					select: { id: true, code: true, title: true, description: true },
				},
				segments: {
					select: { id: true, timeToComplete: true, status: true },
				},
			},
		})
		return toModuleSummary(updated)
	}

	/**
	 * Temporarily “removes” a module from its old level by giving it
	 * a negative order, so it won't collide when closing the gap.
	 */
	private async temporarilyRemoveFromOldLevel(
		tx: Prisma.TransactionClient,
		id: number,
		oldOrder: number,
	): Promise<void> {
		await tx.module.update({
			where: { id },
			data: { order: -oldOrder },
		})
	}

	/**
	 * Decrements (shifts left) the order of every module in `levelId`
	 * whose order is > `thresholdOrder`.
	 */
	private async decrementOrdersAbove(
		db: Prisma.TransactionClient | PrismaClient,
		levelId: number,
		thresholdOrder: number,
	): Promise<void> {
		await db.module.updateMany({
			where: {
				proficiencyLevelId: levelId,
				order: { gt: thresholdOrder },
			},
			data: {
				order: { decrement: 1 },
			},
		})
	}

	/**
	 * Finds the highest existing order in `levelId` and returns +1,
	 * or 1 if no modules exist yet.
	 */
	private async getNextOrderForLevel(
		tx: Prisma.TransactionClient,
		levelId: number,
	): Promise<number> {
		const highest = await tx.module.findFirst({
			where: { proficiencyLevelId: levelId },
			orderBy: { order: 'desc' },
			select: { order: true },
		})
		return highest ? highest.order + 1 : 1
	}

	/**
	 * Inserts (moves) the module into its new level with computed order
	 * and updates all other fields.
	 */
	private async insertIntoNewLevel(
		tx: Prisma.TransactionClient,
		id: number,
		levelId: number,
		order: number,
		dto: UpdateModuleDto,
	): Promise<void> {
		await tx.module.update({
			where: { id },
			data: {
				proficiencyLevelId: levelId,
				order,
				title: dto.title,
				description: dto.description,
				theoryContent: dto.theoryContent,
			},
		})
	}

	/**
	 * Reloads the module (with relations) and maps to DTO.
	 */
	private async reloadModuleSummary(id: number): Promise<ModuleSummaryDto> {
		const reloaded = await this.prisma.module.findUnique({
			where: { id },
			include: {
				proficiencyLevel: {
					select: { id: true, code: true, title: true, description: true },
				},
				segments: {
					select: { id: true, timeToComplete: true, status: true },
				},
			},
		})
		if (!reloaded) {
			throw new NotFoundException(`Module #${id} not found after update`)
		}
		return toModuleSummary(reloaded)
	}

	/**
	 * Main update entrypoint. If the module's level doesn’t change,
	 * updates fields in place; otherwise, moves it across levels.
	 */
	async update(id: number, dto: UpdateModuleDto): Promise<ModuleSummaryDto> {
		const { proficiencyLevelId: oldLevelId, order: oldOrder } = await this.fetchModuleMeta(id)
		const newLevelId = dto.proficiencyLevelId ?? oldLevelId

		if (newLevelId === oldLevelId) {
			return this.updateFieldsWithoutReordering(id, dto)
		}

		await this.prisma.$transaction(async tx => {
			await this.temporarilyRemoveFromOldLevel(tx, id, oldOrder)
			await this.decrementOrdersAbove(tx, oldLevelId, oldOrder)
			const nextOrder = await this.getNextOrderForLevel(tx, newLevelId)
			await this.insertIntoNewLevel(tx, id, newLevelId, nextOrder, dto)
		})

		return this.reloadModuleSummary(id)
	}

	/**
	 * Removes a module and then shifts left all orders in its old level.
	 */
	async remove(id: number): Promise<void> {
		const { proficiencyLevelId, order } = await this.fetchModuleMeta(id)
		await this.prisma.module.delete({ where: { id } })
		await this.decrementOrdersAbove(this.prisma, proficiencyLevelId, order)
	}

	async list(query: ModulesFilter): Promise<PaginatedResponse<ModuleSummaryDto>> {
		const {
			page = DEFAULT_PAGINATION.page,
			pageSize = DEFAULT_PAGINATION.pageSize,
			disablePagination,
			search,
			proficiencyLevelId,
			status,
			minTime,
			maxTime,
		} = query

		const where: Prisma.ModuleWhereInput = {}
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			]
		}
		if (proficiencyLevelId) where.proficiencyLevelId = proficiencyLevelId
		if (status) where.status = status

		const pageData = await paginatePrisma(
			this.prisma.module,
			{
				where,
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
			},
			this.prisma.module,
			{ where },
			{ page, pageSize, disablePagination },
		)

		const filtered = pageData.data
			.map(toModuleSummary)
			.filter(
				m =>
					(minTime == null || m.estimatedTime >= minTime) &&
					(maxTime == null || m.estimatedTime <= maxTime),
			)

		return {
			data: filtered,
			pagination: pageData.pagination,
		}
	}

	async reorderSegments(moduleId: number, dto: ReorderSegmentsDto): Promise<void> {
		const { items } = dto

		// 1) Fetch all segment IDs belonging to this module
		const existingSegments = await this.prisma.segment.findMany({
			where: { moduleId },
			select: { id: true },
		})

		if (existingSegments.length === 0) {
			throw new NotFoundException(`Module #${moduleId} has no segments`)
		}

		// 2) Validate that the client supplied the exact same count
		if (items.length !== existingSegments.length) {
			throw new BadRequestException(
				`Expected ${existingSegments.length} segment(s), but got ${items.length}`,
			)
		}

		// 3) Ensure each segmentId belongs to this module
		const validIds = new Set(existingSegments.map(s => s.id))
		for (const { segmentId } of items) {
			if (!validIds.has(segmentId)) {
				throw new BadRequestException(
					`Segment #${segmentId} does not belong to module #${moduleId}`,
				)
			}
		}

		// 4) Phase 1: set each segment’s order to a negative “placeholder”
		await this.prisma.$transaction(
			items.map(item =>
				this.prisma.segment.update({
					where: { id: item.segmentId },
					data: { order: -item.order }, // temp negative
				}),
			),
		)

		// 5) Phase 2: set each segment’s order to its actual new (positive) value
		await this.prisma.$transaction(
			items.map(item =>
				this.prisma.segment.update({
					where: { id: item.segmentId },
					data: { order: item.order },
				}),
			),
		)
	}
}
