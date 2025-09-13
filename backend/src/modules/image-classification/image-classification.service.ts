import axios from 'axios'
import { AppConfigService } from 'src/common/config/config.service'
import { CarAnalysis, CarAnalysisZone } from '@prisma/client'

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
import { PrismaService } from 'src/prisma/prisma.service'
import { LLMCarAnalysisAdapter } from 'src/common/adapters/llm-car-analysis.adapter'

@Injectable()
export class ImageClassificationService {
	private readonly s3: S3Service
	constructor(
		s3: S3Service,
		private readonly config: AppConfigService,
		private readonly prisma: PrismaService,
		private readonly llmCarAnalysisAdapter: LLMCarAnalysisAdapter,
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
		// Fetch user info
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { carModel: true, carYear: true, city: true, vinNumber: true, id: true },
		})
		if (!user) throw new Error('User not found')

		// Fetch partners and services (stub, replace with real queries)
		const partners = await this.prisma.inDrivePartner.findMany()
		const services = [] // TODO: fetch or define services

		// Call LLM adapter (assume injected as this.llmCarAnalysisAdapter)
		const carInfo = {
			carModel: user.carModel || '',
			carYear: user.carYear || 0,
			city: user.city || '',
			vin: user.vinNumber || '',
		}
		// Call LLM adapter (assume injected as this.llmCarAnalysisAdapter)
		const llmResult = await this.llmCarAnalysisAdapter.analyze(
			pipelineResult,
			userId,
			carInfo,
			partners,
			services,
		)

		// Save to DB
		const created = await this.prisma.carAnalysis.create({
			data: {
				userId,
				carModel: llmResult.carModel,
				carYear: llmResult.carYear,
				city: llmResult.city,
				vin: llmResult.vin,
				totalEstimatedCost: llmResult.totalEstimatedCost,
				zones: {
					create: llmResult.zones.map(z => ({
						name: z.name,
						breaking: z.breaking,
						hasRust: z.hasRust,
						isDirty: z.isDirty,
						importance: z.aiAnalysis.importance,
						consequences: z.aiAnalysis.consequences,
						estimatedCost: z.aiAnalysis.estimatedCost,
						urgency: z.aiAnalysis.urgency,
						timeToFix: z.aiAnalysis.timeToFix,
					})),
				},
			},
			include: { zones: true },
		})
		return {
			...llmResult,
			id: created.id,
			createdAt: created.createdAt,
			zones: created.zones.map(z => ({
				name: z.name,
				breaking: z.breaking,
				hasRust: z.hasRust,
				isDirty: z.isDirty,
				aiAnalysis: {
					importance: z.importance,
					consequences: z.consequences,
					estimatedCost: z.estimatedCost,
					urgency: z.urgency,
					timeToFix: z.timeToFix,
				},
			})),
		}
	}

	async getLatestAnalysis(
		userId: number,
	): Promise<(CarAnalysis & { zones: CarAnalysisZone[] }) | null> {
		return await this.prisma.carAnalysis.findFirst({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: { zones: true },
		})
	}
}
