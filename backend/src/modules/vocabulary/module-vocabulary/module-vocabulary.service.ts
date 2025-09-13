// src/modules/vocabulary/module-vocabulary/module-vocabulary.service.ts

import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { PrismaService } from 'src/prisma/prisma.service'

import {
	BaseModuleVocabularyDto,
	BulkUpsertModuleVocabularyDto,
	CreateModuleVocabularyDto,
	ModuleVocabularyFilterDto,
	UpdateModuleVocabularyDto,
} from './dtos/module-vocabulary.dtos'
import { toBaseModuleVocabularyDto } from './utils/module-vocabulary.mapper'

@Injectable()
export class ModuleVocabularyService {
	constructor(private readonly prisma: PrismaService) {}

	async listModuleVocabulary(query: ModuleVocabularyFilterDto) {
		const { page, pageSize, disablePagination, moduleId, search } = query

		const where: Prisma.ModuleVocabularyWhereInput = {}
		if (moduleId) {
			where.moduleId = moduleId
		}
		if (search) {
			where.OR = [
				{ word: { contains: search, mode: 'insensitive' } },
				{
					translations: {
						some: { translation: { contains: search, mode: 'insensitive' } },
					},
				},
				{ example: { contains: search, mode: 'insensitive' } },
			]
		}

		const pageData = await paginatePrisma(
			this.prisma.moduleVocabulary,
			{
				where,
				include: { translations: true },
				orderBy: { createdAt: 'desc' },
			},
			this.prisma.moduleVocabulary,
			{ where },
			{ page, pageSize, disablePagination },
		)

		return {
			data: pageData.data.map(toBaseModuleVocabularyDto),
			pagination: pageData.pagination,
		}
	}

	async getModuleVocabularyById(id: number) {
		const m = await this.prisma.moduleVocabulary.findUnique({
			where: { id },
			include: { translations: true },
		})
		if (!m) throw new NotFoundException(`ModuleVocabulary ${id} not found`)
		return toBaseModuleVocabularyDto(m)
	}

	async createModuleVocabulary(dto: CreateModuleVocabularyDto) {
		const created = await this.prisma.moduleVocabulary.create({
			data: {
				moduleId: dto.moduleId,
				word: dto.word,
				example: dto.example,
				translations: {
					create: dto.translations.map(t => ({
						language: t.language,
						translation: t.translation,
						description: t.description,
					})),
				},
			},
			include: { translations: true },
		})
		return toBaseModuleVocabularyDto(created)
	}

	async updateModuleVocabulary(id: number, dto: UpdateModuleVocabularyDto) {
		const updated = await this.prisma.moduleVocabulary.update({
			where: { id },
			data: {
				word: dto.word,
				example: dto.example,
				translations: {
					deleteMany: {},
					create: dto.translations?.map(t => ({
						language: t.language,
						translation: t.translation,
						description: t.description,
					})),
				},
			},
			include: { translations: true },
		})
		return toBaseModuleVocabularyDto(updated)
	}

	async removeModuleVocabulary(id: number): Promise<void> {
		await this.prisma.moduleVocabulary.delete({ where: { id } })
	}

	async bulkUpsertModuleVocabulary(
		dto: BulkUpsertModuleVocabularyDto,
	): Promise<BaseModuleVocabularyDto[]> {
		return this.prisma.$transaction<BaseModuleVocabularyDto[]>(async tx => {
			const results: BaseModuleVocabularyDto[] = []

			for (const entry of dto.entries) {
				const existing = await tx.moduleVocabulary.findFirst({
					where: {
						moduleId: entry.moduleId,
						word: entry.word,
					},
				})

				let record
				if (existing) {
					record = await tx.moduleVocabulary.update({
						where: { id: existing.id },
						data: {
							example: entry.example ?? null,
							translations: {
								deleteMany: {},
								create: entry.translations.map(t => ({
									language: t.language,
									translation: t.translation,
									description: t.description,
								})),
							},
						},
						include: { translations: true },
					})
				} else {
					record = await tx.moduleVocabulary.create({
						data: {
							moduleId: entry.moduleId,
							word: entry.word,
							example: entry.example ?? null,
							translations: {
								create: entry.translations.map(t => ({
									language: t.language,
									translation: t.translation,
									description: t.description,
								})),
							},
						},
						include: { translations: true },
					})
				}

				results.push(
					toBaseModuleVocabularyDto(
						record as Prisma.ModuleVocabularyGetPayload<{
							include: { translations: true }
						}>,
					),
				)
			}

			return results
		})
	}
}
