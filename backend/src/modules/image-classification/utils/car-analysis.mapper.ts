import { CarAnalysisDto } from '../dtos/car-analysis.dto'
import { CarAnalysisWithZones } from '../interfaces'

export class CarAnalysisMapper {
	static toDto(model: CarAnalysisWithZones): CarAnalysisDto {
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
			zones: (model.zones || []).map(zone => ({
				name: zone.name,
				breaking: zone.breaking,
				hasRust: zone.hasRust,
				isDirty: zone.isDirty,
				aiAnalysis: {
					importance: zone.importance,
					consequences: zone.consequences,
					estimatedCost: zone.estimatedCost,
					urgency: zone.urgency,
					timeToFix: zone.timeToFix,
				},
			})),
		}
	}
}
