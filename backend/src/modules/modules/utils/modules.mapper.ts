import { Prisma, APPROVAL_STATUS } from '@prisma/client'
import { BaseModuleDto, ModuleSummaryDto } from '../dtos/modules.dtos'
import { BaseProficiencyLevelDto } from 'src/modules/proficiency-levels/dtos/proficiency-level.dtos'

export type ModuleWithRelations = Prisma.ModuleGetPayload<{
	include: {
		proficiencyLevel: {
			select: {
				id: true
				code: true
				title: true
				description: true
			}
		}
		segments: {
			select: {
				id: true
				timeToComplete: true
				status: true
			}
		}
	}
}>

/**
 * Map a Module + its proficiencyLevel + segments to the summary DTO.
 */
export function toModuleSummary(mod: ModuleWithRelations): ModuleSummaryDto {
	const segCount = mod.segments.length
	const pubCount = mod.segments.filter(s => s.status === APPROVAL_STATUS.PUBLISHED).length
	const estTime = mod.segments.reduce((sum, s) => sum + s.timeToComplete, 0)

	const pl: BaseProficiencyLevelDto = {
		id: mod.proficiencyLevel.id,
		code: mod.proficiencyLevel.code,
		title: mod.proficiencyLevel.title,
		description: mod.proficiencyLevel.description,
	}

	const base: BaseModuleDto = {
		id: mod.id,
		title: mod.title,
		theoryContent: mod.theoryContent,
		outcomes: mod.outcomes,
		description: mod.description,
		order: mod.order,
		status: mod.status,
		level: pl,
	}

	return {
		...base,
		segmentCount: segCount,
		estimatedTime: estTime,
		publishedPercentage: segCount > 0 ? Math.floor((pubCount / segCount) * 100) : 0,
	}
}
