import { INTEREST } from '@prisma/client'
import { AdapterSegmentDto, InterestSegmentDto } from './segment-adapter.types'

export interface SegmentsAdapter {
	/**
	 * Generate an array of segment definitions for the given module.
	 * @param moduleId   the ID of the module under which these new segments will live
	 * @param count      how many segments to generate
	 */
	generateSegments(moduleId: number, count?: number): Promise<AdapterSegmentDto[]>

	/**
	 * Merge the given segment IDs into a single segment (with some AI logic).
	 * Returns exactly one merged object in an array.
	 */
	mergeSegments(moduleId: number, segmentIds: number[]): Promise<AdapterSegmentDto[]>

	/**
	 * Split a single segment into multiple segments (again via AI logic).
	 * Returns as many pieces as the prompt asked for.
	 */
	splitSegments(segmentId: number, count?: number): Promise<AdapterSegmentDto[]>

	/**
	 * Generate a new segment based on the given interest.
	 * Returns an array with exactly one segment if count not specified.
	 */
	generateInterestSegments(segmentId: number, interests: INTEREST[]): Promise<InterestSegmentDto[]>

	generateInterestSegment(segmentId: number, interest: INTEREST): Promise<InterestSegmentDto>
}
