import { APPROVAL_STATUS } from '@prisma/client'
import { UpdateExerciseDto, ExercisePayload } from '../dtos/exercises.dtos'

export function parseUpdateExerciseMultipartBody(raw: Record<string, unknown>): UpdateExerciseDto {
	return {
		title: typeof raw.title === 'string' ? raw.title : undefined,
		status:
			typeof raw.status === 'string' &&
			Object.values(APPROVAL_STATUS).includes(raw.status as APPROVAL_STATUS)
				? (raw.status as APPROVAL_STATUS)
				: undefined,
		payload:
			typeof raw.payload === 'string' ? (JSON.parse(raw.payload) as ExercisePayload) : undefined,
	}
}
