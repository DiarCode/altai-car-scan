import { CarAnalysis } from '@prisma/client'
import { LLMCarZoneAnalysis } from '../interfaces'

export class CarAnalysisZoneDto {
	name: string
	breaking: boolean
	hasRust: boolean
	isDirty: boolean
	aiAnalysis: {
		importance: string // IMPORTANCE enum
		consequences: string[]
		estimatedCost: number
		urgency: string // URGENCY enum
		timeToFix: string | null
	}

	static fromModel(model: LLMCarZoneAnalysis): CarAnalysisZoneDto {
		return {
			...model,
			aiAnalysis: { ...model.aiAnalysis },
		}
	}
}

export class CarAnalysisDto {
	id: number
	carModel: string
	carYear: number
	city: string
	vin: string
	createdAt: string | Date
	totalEstimatedCost: number
	overallScore: number
	status: string
	zones: CarAnalysisZoneDto[]
}

export function fromModel(model: CarAnalysis): CarAnalysisDto {
	return {
		id: model.id,
		carModel: model.carModel,
		carYear: model.carYear,
		city: model.city,
		vin: model.vin,
		createdAt: model.createdAt,
		totalEstimatedCost: model.totalEstimatedCost,
		overallScore: model.overallScore ?? 0,
		status: model.status ?? 'EXCELLENT',
		zones: ((model as CarAnalysis & { zones?: LLMCarZoneAnalysis[] }).zones || []).map(zone =>
			CarAnalysisZoneDto.fromModel(zone),
		),
	}
}
