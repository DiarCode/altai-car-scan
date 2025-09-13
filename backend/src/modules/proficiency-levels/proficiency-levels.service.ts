import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
} from '@nestjs/common'
import { Prisma, ProficiencyLevel } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { PrismaErrorCode } from 'src/common/constants/prisma.errors'
import {
	CreateProficiencyLevelDto,
	UpdateProficiencyLevelDto,
	ReorderModulesDto,
	ProficiencyLevelSummaryDto,
} from './dtos/proficiency-level.dtos'
import { mapLevelToSummaryDto } from './utils/proficiency-levels.mapper'

@Injectable()
export class ProficiencyLevelsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<ProficiencyLevelSummaryDto[]> {
		const levels = await this.prisma.proficiencyLevel.findMany({
			include: {
				modules: {
					orderBy: { order: 'asc' },
					include: { segments: true },
				},
			},
			orderBy: { code: 'asc' },
		})

		return levels.map(mapLevelToSummaryDto)
	}

	async findOne(id: number): Promise<ProficiencyLevelSummaryDto> {
		const level = await this.prisma.proficiencyLevel.findUnique({
			where: { id },
			include: { modules: { include: { segments: true }, orderBy: { order: 'asc' } } },
		})
		if (!level) throw new NotFoundException(`Level #${id} not found`)
		return mapLevelToSummaryDto(level)
	}

	async getNextProficiencyLevel(
		currentLevelId: number,
	): Promise<ProficiencyLevelSummaryDto | null> {
		const allLevels = await this.prisma.proficiencyLevel.findMany({
			orderBy: { code: 'asc' }, // Order by enum string value
			include: { modules: { include: { segments: true }, orderBy: { order: 'asc' } } },
		})

		const currentLevelIndex = allLevels.findIndex(level => level.id === currentLevelId)

		if (currentLevelIndex === -1) {
			throw new NotFoundException(`Proficiency level ${currentLevelId} not found.`)
		}

		const nextLevel = allLevels[currentLevelIndex + 1]

		if (!nextLevel) {
			return null // No next level found
		}

		return mapLevelToSummaryDto(nextLevel)
	}

	async create(dto: CreateProficiencyLevelDto): Promise<ProficiencyLevel> {
		try {
			return await this.prisma.proficiencyLevel.create({ data: dto })
		} catch (e) {
			if (
				e instanceof Prisma.PrismaClientKnownRequestError &&
				e.code === String(PrismaErrorCode.UniqueConstraintViolation)
			) {
				throw new ConflictException(`Code "${dto.code}" already exists`)
			}
			throw e
		}
	}

	async update(id: number, dto: UpdateProficiencyLevelDto): Promise<ProficiencyLevel> {
		await this.findOne(id)
		try {
			return await this.prisma.proficiencyLevel.update({
				where: { id },
				data: dto,
			})
		} catch (e) {
			if (
				e instanceof Prisma.PrismaClientKnownRequestError &&
				e.code === String(PrismaErrorCode.UniqueConstraintViolation)
			) {
				throw new ConflictException(`Code "${dto.code}" already exists`)
			}
			throw e
		}
	}

	async remove(id: number): Promise<ProficiencyLevel> {
		await this.findOne(id)
		return this.prisma.proficiencyLevel.delete({ where: { id } })
	}

	async reorderModules(levelId: number, dto: ReorderModulesDto): Promise<void> {
		// 1) Fetch all module IDs belonging to this proficiency level
		const existingModules = await this.prisma.module.findMany({
			where: { proficiencyLevelId: levelId },
			select: { id: true },
		})

		if (existingModules.length === 0) {
			throw new NotFoundException(`Proficiency level #${levelId} has no modules`)
		}

		// 2) Validate that the client supplied the exact same count
		if (dto.items.length !== existingModules.length) {
			throw new BadRequestException(
				`Expected ${existingModules.length} modules, but got ${dto.items.length}`,
			)
		}

		// 3) Ensure each moduleId belongs to this proficiency level
		const validIds = new Set(existingModules.map(m => m.id))
		for (const { moduleId } of dto.items) {
			if (!validIds.has(moduleId)) {
				throw new BadRequestException(`Module #${moduleId} does not belong to level #${levelId}`)
			}
		}

		// 4) Phase 1: set each module's order to a negative placeholder (-newOrder)
		await this.prisma.$transaction(
			dto.items.map(item =>
				this.prisma.module.update({
					where: { id: item.moduleId },
					data: { order: -item.order },
				}),
			),
		)

		// 5) Phase 2: set each module's order to its actual (positive) value
		await this.prisma.$transaction(
			dto.items.map(item =>
				this.prisma.module.update({
					where: { id: item.moduleId },
					data: { order: item.order },
				}),
			),
		)
	}
}
