// src/assessment/utils/assessment.mapper.ts

import { AssessmentQuestion, AssessmentAnswer, ProficiencyLevel } from '@prisma/client'
import { LEVEL_CODE } from '@prisma/client'
import {
	AdminAssessmentQuestionDto,
	AssessmentAnswerDto,
	AssessmentQuestionDto,
	AssessmentTestDto,
	LevelScoreDto,
	SELF_LEVEL,
	SubmitAssessmentTestResponseDto,
} from '../dtos/assessment.dtos'

// ——— Constants & Helpers ——————————————————————————————————

/** Full order of all level codes, low→high (C2 removed) */
const LEVEL_ORDER: LEVEL_CODE[] = [
	LEVEL_CODE.A1,
	LEVEL_CODE.A2,
	LEVEL_CODE.B1,
	LEVEL_CODE.B2,
	LEVEL_CODE.C1,
]

/** All levels for iteration (C2 removed) */
const ALL_LEVEL_CODES = [...LEVEL_ORDER]

/** Map self-assessment to starting level */
const START_LEVEL_MAP: Record<SELF_LEVEL, LEVEL_CODE> = {
	[SELF_LEVEL.BEGINNER]: LEVEL_CODE.A2,
	[SELF_LEVEL.INTERMEDIATE]: LEVEL_CODE.B1,
	[SELF_LEVEL.ADVANCED]: LEVEL_CODE.C1,
}

// Fixed percentage thresholds optimized for 3 questions
const THRESHOLDS = {
	LOW: 50, // 0-50%: Low performance (0-1 out of 3)
	MEDIUM: 90, // 51-90%: Medium performance (2 out of 3)
	HIGH: 91, // 91-100%: High performance (3 out of 3)
} as const

enum PERFORMANCE_LEVEL {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
}

/**
 * Helper function to calculate percentage from score (handles null values)
 */
function calculatePercentage(score: number | null | undefined, total: number): number | null {
	if (score === null || score === undefined) return null
	return Math.round((score / total) * 100)
}

/**
 * Helper function to determine performance level based on percentage (handles null values)
 */
function getPerformanceLevel(percentage: number | null): PERFORMANCE_LEVEL | null {
	if (percentage === null || percentage === undefined) return null
	if (percentage <= THRESHOLDS.LOW) return PERFORMANCE_LEVEL.LOW
	if (percentage <= THRESHOLDS.MEDIUM) return PERFORMANCE_LEVEL.MEDIUM
	return PERFORMANCE_LEVEL.HIGH
}

/** CDN base URL, computed once */
const S3_BASE_URL = (() => {
	const e = process.env.S3_RESPONSE_ENDPOINT
	const b = process.env.S3_BUCKET
	const p = process.env.S3_IMAGE_PREFIX ?? 'images'
	return e && b ? `${e}/${b}/${p}` : 'https://itutor.sytes.net/cdn/itutor-media/images'
})()

/** Prepend CDN URL or undefined */
const buildImageUrl = (key?: string | null): string | undefined =>
	key ? `${S3_BASE_URL}/${key}` : undefined

// ——— Model → DTO Mappers ———————————————————————————————

export const mapAnswerModelToDto = (a: AssessmentAnswer): AssessmentAnswerDto => ({
	id: a.id,
	answer: a.answer,
	isCorrect: a.isCorrect,
})

export const mapQuestionModelToAdminQuestionDto = (
	q: AssessmentQuestion & {
		answers: AssessmentAnswer[]
		proficiencyLevel?: ProficiencyLevel
	},
): AdminAssessmentQuestionDto => ({
	id: q.id,
	question: q.question,
	imageUrl: buildImageUrl(q.image_key),
	proficiencyLevelCode: q.proficiencyLevel!.code,
	answers: q.answers.map(mapAnswerModelToDto),
})

export const mapQuestionModelToDto = (
	q: AssessmentQuestion & {
		answers: AssessmentAnswer[]
		proficiencyLevel?: ProficiencyLevel
	},
): AssessmentQuestionDto => ({
	id: q.id,
	question: q.question,
	imageUrl: buildImageUrl(q.image_key),
	answers: q.answers.map(mapAnswerModelToDto),
	proficiencyLevelCode: q.proficiencyLevel?.code ?? LEVEL_CODE.A1,
})

export const mapTestModelToDto = (
	byLevel: Map<
		LEVEL_CODE,
		Array<
			AssessmentQuestion & {
				answers: AssessmentAnswer[]
				proficiencyLevel: ProficiencyLevel
			}
		>
	>,
): AssessmentTestDto => ({
	questions: ALL_LEVEL_CODES.reduce(
		(acc, lvl) => ({
			...acc,
			[lvl]: byLevel.get(lvl)?.map(mapQuestionModelToDto) ?? [],
		}),
		{} as Record<LEVEL_CODE, AssessmentQuestionDto[]>,
	),
})

// ——— Adaptive Test Logic ——————————————————————————————

export const getStartingLevelCode = (self: SELF_LEVEL): LEVEL_CODE =>
	START_LEVEL_MAP[self] ?? LEVEL_CODE.A2

/**
 * Implements the exact adaptive assessment algorithm as specified
 */
export const mapAdaptiveSubmitResponse = (
	selfLevel: SELF_LEVEL,
	levelScores: LevelScoreDto,
	questionsPerLevel: number,
): SubmitAssessmentTestResponseDto => {
	const result = determineAdaptiveLevel(selfLevel, levelScores, questionsPerLevel)

	// Calculate total statistics
	const testedLevels = Object.entries(levelScores)
		.filter(([, score]) => score !== null && score !== undefined)
		.map(([level]) => level as LEVEL_CODE)

	const totalQuestions = testedLevels.length * questionsPerLevel
	const totalCorrect = testedLevels.reduce((sum, level) => sum + (levelScores[level] ?? 0), 0)
	const totalScorePercent =
		totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

	return {
		totalScorePercent,
		assignedLevel: result.assignedLevel,
		levelBreakdown: levelScores,
		explanation: result.explanation,
	}
}

/**
 * Determines the adaptive level based on the exact algorithm specification
 */
function determineAdaptiveLevel(
	selfLevel: SELF_LEVEL,
	levelScores: LevelScoreDto,
	questionsPerLevel: number,
): { assignedLevel: LEVEL_CODE; explanation: string } {
	// Validate questionsPerLevel
	if (questionsPerLevel < 1) {
		throw new Error(`Invalid questionsPerLevel: ${questionsPerLevel}`)
	}

	switch (selfLevel) {
		case SELF_LEVEL.BEGINNER:
			return handleBeginnerFlow(levelScores, questionsPerLevel)

		case SELF_LEVEL.INTERMEDIATE:
			return handleIntermediateFlow(levelScores, questionsPerLevel)

		case SELF_LEVEL.ADVANCED:
			return handleAdvancedFlow(levelScores, questionsPerLevel)

		default:
			return {
				assignedLevel: LEVEL_CODE.A1,
				explanation: 'Unknown self-level provided. Defaulting to A1.',
			}
	}
}

/**
 * BEGINNER Flow (Optimized for 3 questions):
 * - Start with A2
 * - if 0-50% (0-1/3) → result=A1
 * - if 51-90% (2/3) → result=A2
 * - if 91-100% (3/3) → test B2
 *   - in B2 if 0-50% (0-1/3) → result=B1
 *   - in B2 if 51-90% (2/3) → result=B2
 *   - in B2 if 91-100% (3/3) → result=C1
 */
function handleBeginnerFlow(
	levelScores: LevelScoreDto,
	questionsPerLevel: number,
): { assignedLevel: LEVEL_CODE; explanation: string } {
	const a2Score = levelScores.A2
	const a2Percentage = calculatePercentage(a2Score, questionsPerLevel)
	const a2Performance = getPerformanceLevel(a2Percentage)

	// A2 test must have been taken for BEGINNER flow
	if (a2Performance === null) {
		throw new Error('BEGINNER flow requires A2 test results')
	}

	if (a2Performance === PERFORMANCE_LEVEL.LOW) {
		return {
			assignedLevel: LEVEL_CODE.A1,
			explanation: `Scored ${a2Score}/${questionsPerLevel} (${a2Percentage}%) on A2 level. Starting with foundational A1 content.`,
		}
	}

	if (a2Performance === PERFORMANCE_LEVEL.MEDIUM) {
		return {
			assignedLevel: LEVEL_CODE.A2,
			explanation: `Scored ${a2Score}/${questionsPerLevel} (${a2Percentage}%) on A2 level. Ready to work at A2 level.`,
		}
	}

	if (a2Performance === PERFORMANCE_LEVEL.HIGH) {
		const b2Score = levelScores.B2
		const b2Percentage = calculatePercentage(b2Score, questionsPerLevel)
		const b2Performance = getPerformanceLevel(b2Percentage)

		// B2 test must have been taken after perfect A2
		if (b2Performance === null) {
			throw new Error('BEGINNER flow with perfect A2 requires B2 test results')
		}

		if (b2Performance === PERFORMANCE_LEVEL.LOW) {
			return {
				assignedLevel: LEVEL_CODE.B1,
				explanation: `Strong A2 performance (${a2Percentage}%) but B2 was challenging (${b2Percentage}%). Starting at B1 level.`,
			}
		}

		if (b2Performance === PERFORMANCE_LEVEL.MEDIUM) {
			return {
				assignedLevel: LEVEL_CODE.B2,
				explanation: `Strong A2 (${a2Percentage}%) and good B2 performance (${b2Percentage}%). Ready for B2 level.`,
			}
		}

		if (b2Performance === PERFORMANCE_LEVEL.HIGH) {
			return {
				assignedLevel: LEVEL_CODE.C1,
				explanation: `Exceptional performance! Strong scores on both A2 (${a2Percentage}%) and B2 (${b2Percentage}%). Ready for advanced C1 level.`,
			}
		}
	}

	// Fallback (shouldn't reach here with valid data)
	return {
		assignedLevel: LEVEL_CODE.A1,
		explanation: `Unexpected score pattern. Defaulting to A1 level.`,
	}
}

/**
 * INTERMEDIATE Flow (Optimized for 3 questions):
 * - Start with B1
 * - if 0-50% (0-1/3) → test A1
 *   - in A1 if 51-100% (2-3/3) → result=A2
 *   - in A1 if 0-50% (0-1/3) → result=A1
 * - if 51-90% (2/3) on B1 → result=B1
 * - if 91-100% (3/3) → test B2
 *   - in B2 if 0-90% (0-2/3) → result=B2
 *   - in B2 if 91-100% (3/3) → result=C1
 */
function handleIntermediateFlow(
	levelScores: LevelScoreDto,
	questionsPerLevel: number,
): { assignedLevel: LEVEL_CODE; explanation: string } {
	const b1Score = levelScores.B1
	const b1Percentage = calculatePercentage(b1Score, questionsPerLevel)
	const b1Performance = getPerformanceLevel(b1Percentage)

	// B1 test must have been taken for INTERMEDIATE flow
	if (b1Performance === null) {
		throw new Error('INTERMEDIATE flow requires B1 test results')
	}

	if (b1Performance === PERFORMANCE_LEVEL.LOW) {
		const a1Score = levelScores.A1
		const a1Percentage = calculatePercentage(a1Score, questionsPerLevel)
		const a1Performance = getPerformanceLevel(a1Percentage)

		// A1 test must have been taken after poor B1
		if (a1Performance === null) {
			throw new Error('INTERMEDIATE flow with poor B1 requires A1 test results')
		}

		if (a1Performance === PERFORMANCE_LEVEL.MEDIUM || a1Performance === PERFORMANCE_LEVEL.HIGH) {
			return {
				assignedLevel: LEVEL_CODE.A2,
				explanation: `B1 was challenging (${b1Percentage}%) but performed well on A1 (${a1Percentage}%). Starting at A2 level.`,
			}
		} else {
			return {
				assignedLevel: LEVEL_CODE.A1,
				explanation: `Low scores on both B1 (${b1Percentage}%) and A1 (${a1Percentage}%). Building foundation at A1 level.`,
			}
		}
	}

	if (b1Performance === PERFORMANCE_LEVEL.MEDIUM) {
		return {
			assignedLevel: LEVEL_CODE.B1,
			explanation: `Good B1 performance (${b1Percentage}%). Ready to work at B1 level.`,
		}
	}

	if (b1Performance === PERFORMANCE_LEVEL.HIGH) {
		const b2Score = levelScores.B2
		const b2Percentage = calculatePercentage(b2Score, questionsPerLevel)
		const b2Performance = getPerformanceLevel(b2Percentage)

		// B2 test must have been taken after perfect B1
		if (b2Performance === null) {
			throw new Error('INTERMEDIATE flow with perfect B1 requires B2 test results')
		}

		if (b2Performance === PERFORMANCE_LEVEL.LOW || b2Performance === PERFORMANCE_LEVEL.MEDIUM) {
			return {
				assignedLevel: LEVEL_CODE.B2,
				explanation: `Strong B1 (${b1Percentage}%) with B2 score of ${b2Percentage}%. Ready for B2 level.`,
			}
		}

		if (b2Performance === PERFORMANCE_LEVEL.HIGH) {
			return {
				assignedLevel: LEVEL_CODE.C1,
				explanation: `Outstanding performance! Strong scores on both B1 (${b1Percentage}%) and B2 (${b2Percentage}%). Ready for advanced C1 level.`,
			}
		}
	}

	// Fallback
	return {
		assignedLevel: LEVEL_CODE.A2,
		explanation: `Unexpected score pattern. Defaulting to A2 level.`,
	}
}

/**
 * ADVANCED Flow (Optimized for 3 questions):
 * - Start with C1
 * - if 0-50% (0-1/3) → test B1
 *   - in B1 if 91-100% (3/3) → result=B2
 *   - in B1 if 0-90% (0-2/3) → result=A2
 * - if 51-100% (2-3/3) → result=C1
 */
function handleAdvancedFlow(
	levelScores: LevelScoreDto,
	questionsPerLevel: number,
): { assignedLevel: LEVEL_CODE; explanation: string } {
	const c1Score = levelScores.C1
	const c1Percentage = calculatePercentage(c1Score, questionsPerLevel)
	const c1Performance = getPerformanceLevel(c1Percentage)

	// C1 test must have been taken for ADVANCED flow
	if (c1Performance === null) {
		throw new Error('ADVANCED flow requires C1 test results')
	}

	if (c1Performance === PERFORMANCE_LEVEL.LOW) {
		const b1Score = levelScores.B1
		const b1Percentage = calculatePercentage(b1Score, questionsPerLevel)
		const b1Performance = getPerformanceLevel(b1Percentage)

		// B1 test must have been taken after poor C1
		if (b1Performance === null) {
			throw new Error('ADVANCED flow with poor C1 requires B1 test results')
		}

		if (b1Performance === PERFORMANCE_LEVEL.HIGH) {
			return {
				assignedLevel: LEVEL_CODE.B2,
				explanation: `C1 was challenging (${c1Percentage}%) but strong B1 performance (${b1Percentage}%). Ready for B2 level.`,
			}
		} else {
			return {
				assignedLevel: LEVEL_CODE.A2,
				explanation: `Both C1 (${c1Percentage}%) and B1 (${b1Percentage}%) showed gaps. Starting at A2 to build solid foundation.`,
			}
		}
	}

	if (c1Performance === PERFORMANCE_LEVEL.MEDIUM || c1Performance === PERFORMANCE_LEVEL.HIGH) {
		return {
			assignedLevel: LEVEL_CODE.C1,
			explanation: `Strong C1 performance (${c1Percentage}%). Ready for advanced C1 level content.`,
		}
	}

	// Fallback
	return {
		assignedLevel: LEVEL_CODE.A2,
		explanation: `Unexpected score pattern. Defaulting to A2 level.`,
	}
}
