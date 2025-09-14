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
	name: string
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
	zones: LLMCarZoneAnalysis[]
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
		Array.isArray(candidate.zones)
	)
}
