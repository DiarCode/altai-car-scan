import axios from 'axios'
import { AppConfigService } from 'src/common/config/config.service'

// --- TypeScript interfaces and type guards ---
export interface SeverityImage {
	label: string
	confidence: number
}
export interface Damage {
	type: string
	severity_from_box: string
	confidence: number
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
}
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
	zones: LLMCarZoneAnalysis[]
}
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
		Array.isArray(candidate.zones)
	)
}

import { Injectable } from '@nestjs/common'
import { S3Service } from 'src/common/s3/s3.service'

@Injectable()
export class ImageClassificationService {
	private readonly s3: S3Service
	constructor(
		s3: S3Service,
		private readonly config: AppConfigService,
	) {
		this.s3 = s3
	}

	async uploadImageToS3(key: string, buffer: Buffer): Promise<void> {
		await this.s3.uploadImage(key, buffer, 'image/jpeg')
	}

	async callClassificationPipeline(s3Keys: string[]): Promise<ClassificationPipelineResult> {
		// Call external pipeline endpoint with S3 keys
		const url = this.config.classificationPipelineUrl
		const response = await axios.post<ClassificationPipelineResult>(url, { images: s3Keys })
		return response.data
	}

	async analyzeCarWithLLM(
		pipelineResult: ClassificationPipelineResult,
		userId: number,
	): Promise<LLMCarAnalysisResult> {
		// TODO: Fetch services/partners from DB, build prompt, call LLM adapter
		// For now, call the adapter and return the result
		// Example: return await this.llmCarAnalysisAdapter.analyze(pipelineResult, userId)
		await Promise.resolve()
		throw new Error('Not implemented: analyzeCarWithLLM')
	}
}
