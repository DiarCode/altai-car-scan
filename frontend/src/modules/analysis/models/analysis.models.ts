/* =========================
   Types (match server DTOs)
   ========================= */
import type { AxiosRequestConfig } from 'axios'

export type ZoneUploadKey = 'front' | 'back' | 'left' | 'right'

export type AnalyzeCarOptions = {
	/** Forward Axios progress events to caller UI */
	onUploadProgress?: AxiosRequestConfig['onUploadProgress']
	/** AbortController signal for cancel */
	signal?: AbortSignal
	/** Optional custom filenames per field */
	filenames?: Partial<Record<ZoneUploadKey, string>>
}

export type AnalyzeCarFiles = Partial<Record<ZoneUploadKey, File | Blob>>

export enum CarStatus {
	EXCELLENT = 'EXCELLENT',
	COSMETIC_ISSUES = 'COSMETIC_ISSUES',
	MECHANICAL_SERVICE_NEEDED = 'MECHANICAL_SERVICE_NEEDED',
	CRITICAL_CONDITION = 'CRITICAL_CONDITION',
}
export enum URGENCY {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
}

export enum IMPORTANCE {
	CRITICAL = 'CRITICAL',
	MODERATE = 'MODERATE',
	MINOR = 'MINOR',
}

export const IMPORTANCE_LABELS: Record<IMPORTANCE, string> = {
	[IMPORTANCE.CRITICAL]: 'Критично',
	[IMPORTANCE.MODERATE]: 'Умеренно',
	[IMPORTANCE.MINOR]: 'Незначительно',
}

export interface CarAnalysisZoneDto {
	name: string // server may return "FRONT"/"Передняя" depending on mapping
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

export interface CarAnalysisDto {
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
