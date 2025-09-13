import { EXERCISE_TYPE } from '@prisma/client'
import { DEFAULT_THRESHOLDS } from '../types/thresholds'

export function scoreByType(type: EXERCISE_TYPE, score: number): boolean {
	const threshold = DEFAULT_THRESHOLDS[type] ?? 70
	return score >= threshold
}
