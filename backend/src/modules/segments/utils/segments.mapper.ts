import { InterestSegment, Prisma, Segment } from '@prisma/client'
import { BaseSegmentDto, InterestSegmentDto, SegmentDetailDto } from '../dtos/segments.dtos'
import { BaseModuleDto } from '../../modules/dtos/modules.dtos'
import { BaseProficiencyLevelDto } from '../../proficiency-levels/dtos/proficiency-level.dtos'

/**
 * Prisma‐тип: Segment вместе с вложенным module,
 * включая тот минимум полей, что нужен для BaseModuleDto,
 * а у module — вложенный proficiencyLevel для BaseProficiencyLevelDto.
 */
export type SegmentPopulated = Prisma.SegmentGetPayload<{
	include: {
		module: {
			select: {
				id: true
				title: true
				theoryContent: true
				outcomes: true
				description: true
				order: true
				status: true
				proficiencyLevel: {
					select: {
						id: true
						code: true
						title: true
						description: true
					}
				}
			}
		}
		interestSegments: {
			select: {
				id: true
				segmentId: true
				theoryContent: true
				interest: true
				createdAt: true
				updatedAt: true
			}
		}
	}
}>

export function toSegmentDetailDto(s: SegmentPopulated): SegmentDetailDto {
	const dto = new SegmentDetailDto()

	dto.id = s.id
	dto.title = s.title
	dto.theoryContent = s.theoryContent
	dto.order = s.order
	dto.timeToComplete = s.timeToComplete
	dto.status = s.status
	dto.createdAt = s.createdAt
	dto.updatedAt = s.updatedAt

	const pl: BaseProficiencyLevelDto = {
		id: s.module.proficiencyLevel.id,
		code: s.module.proficiencyLevel.code,
		title: s.module.proficiencyLevel.title,
		description: s.module.proficiencyLevel.description,
	}

	const m: BaseModuleDto = {
		id: s.module.id,
		title: s.module.title,
		theoryContent: s.module.theoryContent,
		outcomes: s.module.outcomes,
		description: s.module.description,
		order: s.module.order,
		status: s.module.status,
		level: pl,
	}
	dto.module = m

	if (s.interestSegments) {
		const interestSegmentsPrisma = isInterestSegmentArray(s)
		if (interestSegmentsPrisma.length > 0) {
			dto.interestSegments = interestSegmentsPrisma.map((segment: InterestSegment) =>
				toInterestSegmentDto(segment),
			)
		} else {
			dto.interestSegments = []
		}
	} else {
		dto.interestSegments = []
	}

	return dto
}

export function toInterestSegmentDto(s: InterestSegment): InterestSegmentDto {
	const dto = new InterestSegmentDto()

	dto.id = s.id
	dto.segmentId = s.segmentId
	dto.theoryContent = s.theoryContent
	dto.interest = s.interest
	dto.createdAt = s.createdAt
	dto.updatedAt = s.updatedAt

	return dto
}

export function toBaseSegmentDto(s: Segment): BaseSegmentDto {
	const dto = new BaseSegmentDto()

	dto.id = s.id
	dto.title = s.title
	dto.theoryContent = s.theoryContent
	dto.order = s.order
	dto.timeToComplete = s.timeToComplete
	dto.status = s.status
	dto.createdAt = s.createdAt
	dto.updatedAt = s.updatedAt

	return dto
}

export function isInterestSegmentArray(s: SegmentPopulated): InterestSegment[] {
	if (Array.isArray(s.interestSegments)) {
		return s.interestSegments as InterestSegment[]
	}

	return []
}

export function isSegmentPopulated(s: Segment | SegmentPopulated): s is SegmentPopulated {
	return 'module' in s && 'interestSegments' in s
}
