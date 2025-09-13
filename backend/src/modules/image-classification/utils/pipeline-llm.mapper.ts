// Utility to map raw pipeline result to a more LLM-friendly format
import { ClassificationPipelineResult } from '../interfaces'

export function mapPipelineResultForLLM(result: ClassificationPipelineResult): Record<string, any> {
	return {
		angle: result.angle,
		severity: result.severity_image.label,
		severityConfidence: result.severity_image.confidence,
		integrityScore: result.integrity.score_1to5,
		integrityLabel: result.integrity.label,
		damages: result.damage.map(d => ({
			type: d.type,
			severity_bbox: d.severity_bbox,
			severity_fused: d.severity_fused,
			confidence: d.det_confidence,
			part: d.part,
			bbox: d.bbox,
			area_ratio: d.area_ratio,
		})),
		seg_source: result.seg_source,
	}
}
