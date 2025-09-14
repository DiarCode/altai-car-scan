import { CarStatus, IMPORTANCE, URGENCY } from '@prisma/client'
import {
	CarAnalysisWithZones,
	ensureZoneName,
	ZoneName,
	ensureImportanceEnum,
	ensureUrgencyEnum,
} from '../interfaces'

export class CarAnalysisZoneDto {
	name: ZoneName
	breaking: boolean
	hasRust: boolean
	isDirty: boolean
	aiAnalysis: {
		importance: IMPORTANCE
		consequences: string[]
		estimatedCost: number
		urgency: URGENCY
		timeToFix: string | null
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
	status: CarStatus
	summary?: string
	zones: CarAnalysisZoneDto[]
}

export function fromModel(model: CarAnalysisWithZones): CarAnalysisDto {
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
		summary: model.summary || undefined,
		zones: (model.zones || []).map(z => ({
			name: ensureZoneName(z.name),
			breaking: z.breaking,
			hasRust: z.hasRust,
			isDirty: z.isDirty,
			aiAnalysis: {
				importance: ensureImportanceEnum(z.importance),
				consequences: z.consequences,
				estimatedCost: z.estimatedCost,
				urgency: ensureUrgencyEnum(z.urgency),
				timeToFix: z.timeToFix,
			},
		})),
	}
}
