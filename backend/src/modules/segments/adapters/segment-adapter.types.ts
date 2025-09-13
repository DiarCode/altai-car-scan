import { APPROVAL_STATUS, INTEREST } from '@prisma/client'

/**
 * This is the “payload” shape that any adapter must return
 * whenever it generates/splits/merges segments. It explicitly
 * contains exactly the fields we care about (no `id`, `createdAt`,
 * or `updatedAt`).
 */
export interface AdapterSegmentDto {
	title: string
	theoryContent: string
	order: number
	timeToComplete: number
	status: APPROVAL_STATUS
}

export interface InterestSegmentDto {
	interest: INTEREST
	theoryContent: string
}
