import { APPROVAL_STATUS, Prisma } from '@prisma/client'
import { ProficiencyLevelSummaryDto } from '../dtos/proficiency-level.dtos'

type LevelWithModules = Prisma.ProficiencyLevelGetPayload<{
	include: { modules: { include: { segments: true }; orderBy: { order: 'asc' } } }
}>

export function mapLevelToSummaryDto(level: LevelWithModules): ProficiencyLevelSummaryDto {
	const dto = new ProficiencyLevelSummaryDto()

	dto.id = level.id
	dto.code = level.code
	dto.title = level.title
	dto.description = level.description

	const moduleCount = level.modules.length
	dto.moduleCount = moduleCount

	let totalSegments = 0
	let totalPublished = 0
	let totalTime = 0

	for (const mod of level.modules) {
		totalSegments += mod.segments.length

		for (const seg of mod.segments) {
			if (seg.status === APPROVAL_STATUS.PUBLISHED) {
				totalPublished++
			}
			totalTime += seg.timeToComplete
		}
	}

	dto.estimatedTime = totalTime
	dto.publishedPercentage =
		totalSegments > 0 ? Math.floor((totalPublished / totalSegments) * 100) : 0

	return dto
}
