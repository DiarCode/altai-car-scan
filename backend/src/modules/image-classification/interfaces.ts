// Interfaces for image-classification module
// Move all interfaces from service and dtos here for strong typing

export interface SeverityImage {
	label: string
	confidence: number
}

export interface Damage {
	type: string
	severity_bbox: string
	severity_fused: string
	det_confidence: number
	part: string | null
	bbox: number[]
	area_ratio: number
}

export interface ClassificationPipelineResult {
	angle: string
	severity_image: SeverityImage
	integrity: {
		score_1to5: number
		label: string
	}
	damage: Damage[]
	seg_source: string
}

export type MultiImageClassificationResult = ClassificationPipelineResult[]

export interface LLMCarZoneAnalysis {
	name: ZoneName
	breaking: boolean
	hasRust: boolean
	isDirty: boolean
	aiAnalysis: {
		importance: string
		consequences: string[]
		estimatedCost: number
		urgency: string
		timeToFix: string | null
	}
}

export type ZoneName = 'Передняя' | 'Левая' | 'Правая' | 'Задняя'
export const ZONE_NAME_VALUES: ZoneName[] = ['Передняя', 'Левая', 'Правая', 'Задняя']
export function isZoneName(v: unknown): v is ZoneName {
	return typeof v === 'string' && (ZONE_NAME_VALUES as string[]).includes(v)
}

export interface LLMCarAnalysisResult {
	id: number
	carModel: string
	carYear: number
	city: string
	vin: string
	createdAt: string | Date
	totalEstimatedCost: number
	overallScore: number // 0-100
	status: string // mapped to Prisma enum CarStatus
	summary?: string // 3-5 sentence Russian summary
	zones: LLMCarZoneAnalysis[]
}

// Prisma composite return type helper
export type CarAnalysisWithZones = import('@prisma/client').CarAnalysis & {
	zones: import('@prisma/client').CarAnalysisZone[]
	summary?: string | null
}

// Type guards
export function isClassificationResultValid(obj: any): obj is ClassificationPipelineResult {
	if (typeof obj !== 'object' || obj === null) return false
	const { angle, severity_image, integrity, damage } = obj as {
		angle: unknown
		severity_image: unknown
		integrity: unknown
		damage: unknown
	}
	return (
		typeof angle === 'string' &&
		severity_image !== null &&
		typeof severity_image === 'object' &&
		typeof (severity_image as Record<string, unknown>)['label'] === 'string' &&
		typeof (severity_image as Record<string, unknown>)['confidence'] === 'number' &&
		integrity !== null &&
		typeof integrity === 'object' &&
		typeof (integrity as Record<string, unknown>)['score_1to5'] === 'number' &&
		typeof (integrity as Record<string, unknown>)['label'] === 'string' &&
		Array.isArray(damage)
	)
}

export function isMultiClassificationResultValid(obj: any): obj is MultiImageClassificationResult {
	return Array.isArray(obj) && obj.every(isClassificationResultValid)
}

export const CAR_IMAGE_ANGLES = ['front', 'back', 'left', 'right'] as const
export type CarImageAngle = (typeof CAR_IMAGE_ANGLES)[number]

export function isLLMCarAnalysisResultValid(obj: unknown): obj is LLMCarAnalysisResult {
	if (typeof obj !== 'object' || obj === null) return false
	const candidate = obj as Record<string, unknown>
	return (
		typeof candidate.id === 'number' &&
		typeof candidate.carModel === 'string' &&
		typeof candidate.carYear === 'number' &&
		typeof candidate.city === 'string' &&
		typeof candidate.vin === 'string' &&
		(typeof candidate.createdAt === 'string' || candidate.createdAt instanceof Date) &&
		typeof candidate.totalEstimatedCost === 'number' &&
		typeof candidate.overallScore === 'number' &&
		candidate.overallScore >= 0 &&
		candidate.overallScore <= 100 &&
		typeof candidate.status === 'string' &&
		(candidate.summary === undefined || typeof candidate.summary === 'string') &&
		Array.isArray(candidate.zones)
	)
}

// Narrow helpers (pure functions) to sanitize external / model data
const IMPORTANCE_VALUES = ['CRITICAL', 'MODERATE', 'MINOR'] as const
const URGENCY_VALUES = ['LOW', 'MEDIUM', 'HIGH'] as const
const STATUS_VALUES = [
	'EXCELLENT',
	'COSMETIC_ISSUES',
	'MECHANICAL_SERVICE_NEEDED',
	'CRITICAL_CONDITION',
] as const

export function ensureZoneName(value: unknown): ZoneName {
	if (isZoneName(value)) return value
	const lower = typeof value === 'string' ? value.toLowerCase() : ''
	const map: Record<string, ZoneName> = {
		front: 'Передняя',
		'передняя': 'Передняя',
		back: 'Задняя',
		задняя: 'Задняя',
		rear: 'Задняя',
		left: 'Левая',
		левая: 'Левая',
		right: 'Правая',
		правая: 'Правая',
	}
	return map[lower] || 'Передняя'
}

export function ensureImportance(value: unknown): string {
	const v = typeof value === 'string' ? value.toUpperCase() : ''
	return (IMPORTANCE_VALUES as readonly string[]).includes(v) ? v : 'MINOR'
}

export function ensureUrgency(value: unknown): string {
	const v = typeof value === 'string' ? value.toUpperCase() : ''
	return (URGENCY_VALUES as readonly string[]).includes(v) ? v : 'LOW'
}

export function ensureStatus(value: unknown): string {
	const v = typeof value === 'string' ? value.toUpperCase() : ''
	return (STATUS_VALUES as readonly string[]).includes(v) ? v : 'EXCELLENT'
}
