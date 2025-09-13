// src/modules/exercises/adapters/exercise-adapter.interface.ts
import { EXERCISE_TYPE } from '@prisma/client'
import { AdapterExerciseDto } from './exercise-adapter.types'

export interface ExercisesAdapter {
	/**
	 * Generate `count` new exercises of the given `type` under `interestSegmentId`.
	 * Returns exactly the fields needed to INSERT into the `Exercise` table.
	 */
	generateExercise<T extends EXERCISE_TYPE>(
		interestSegmentId: number,
		type: T,
	): Promise<Array<AdapterExerciseDto<T>>>
}
