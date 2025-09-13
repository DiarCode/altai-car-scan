import { Injectable } from '@nestjs/common'
import { APPROVAL_STATUS, INTEREST } from '@prisma/client'
import { AdapterSegmentDto } from 'src/modules/segments/adapters/segment-adapter.types'
import { SegmentsAdapter } from 'src/modules/segments/adapters/segments-adapter.interface'
import { InterestSegmentDto } from 'src/modules/segments/dtos/segments.dtos'

@Injectable()
export class StubSegmentsAdapter implements SegmentsAdapter {
	async generateSegments(_moduleId: number, count = 3): Promise<AdapterSegmentDto[]> {
		return Promise.resolve(
			Array.from({ length: count }).map((_, i) => ({
				title: `Stub Segment ${i + 1}`,
				theoryContent: `Бұл сегмент тек тестілеу үшін арналған.`,
				order: i + 1,
				timeToComplete: 5,
				status: APPROVAL_STATUS.DRAFT,
			})),
		)
	}

	async mergeSegments(_moduleId: number, _segmentIds: number[]): Promise<AdapterSegmentDto[]> {
		return Promise.resolve([
			{
				title: `Stub Merged Segment (${_segmentIds.length} segments merged)`,
				theoryContent: 'Бұл сегмент бірнеше сегменттерді біріктіру нәтижесінде алынған.',
				order: 1,
				timeToComplete: 10,
				status: APPROVAL_STATUS.DRAFT,
			},
		])
	}

	async splitSegments(_segmentId: number, count = 2): Promise<AdapterSegmentDto[]> {
		return Promise.resolve(
			Array.from({ length: count }).map((_, i) => ({
				title: `Stub Split Segment ${i + 1}`,
				theoryContent: `Бұл бөлік ${i + 1}-ші.`,
				order: i + 1,
				timeToComplete: 3,
				status: APPROVAL_STATUS.DRAFT,
			})),
		)
	}

	async generateInterestSegments(
		segmentId: number,
		interests: INTEREST[],
	): Promise<InterestSegmentDto[]> {
		return Promise.resolve(
			interests.map((interest, index) => ({
				id: index + 1,
				segmentId,
				interest,
				theoryContent: `Stub content for interest ${interest}`,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
		)
	}

	async generateInterestSegment(
		segmentId: number,
		interest: INTEREST,
	): Promise<InterestSegmentDto> {
		return Promise.resolve({
			id: 1,
			segmentId,
			interest,
			theoryContent: `Stub content for interest ${interest}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
	}
}
