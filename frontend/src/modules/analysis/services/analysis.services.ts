// src/modules/analysis/services/image-classification.service.ts
import { type AxiosProgressEvent, isAxiosError } from 'axios'

import { apiClient } from '@/core/configs/axios-instance.config'

import type { CarAnalysisDto, ZoneUploadKey } from '../models/analysis.models'

export class ImageClassificationServiceError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
	) {
		super(message)
		this.name = 'ImageClassificationServiceError'
		Object.setPrototypeOf(this, ImageClassificationServiceError.prototype)
	}
}

/* =========================
   Helpers
   ========================= */

/** Always produce a real ArrayBuffer from any ArrayBufferView (TypedArray/DataView). */
function arrayBufferFromView(view: ArrayBufferView): ArrayBuffer {
	// Copy into fresh ArrayBuffer to avoid SharedArrayBuffer incompat
	const out = new Uint8Array(view.byteLength)
	out.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
	return out.buffer
}

/**
 * Accepts File | Blob | ArrayBuffer | TypedArray | dataURL | objectURL | http(s) URL (CORS) | base64
 * and returns a Blob safely.
 */
async function blobFromInput(input: unknown): Promise<Blob> {
	if (!input) throw new Error('No input provided')

	// File/Blob
	if (input instanceof File || input instanceof Blob) return input

	// ArrayBuffer
	if (input instanceof ArrayBuffer) return new Blob([input])

	// Any TypedArray/DataView
	if (ArrayBuffer.isView(input)) {
		const ab = arrayBufferFromView(input)
		return new Blob([ab])
	}

	if (typeof input === 'string') {
		// data URL or object/remote URL
		if (input.startsWith('data:') || input.startsWith('blob:') || input.startsWith('http')) {
			const res = await fetch(input)
			return await res.blob()
		}
		// bare base64 (best-effort)
		if (/^[A-Za-z0-9+/=\s]+$/.test(input) && input.length > 100) {
			const byteChars = atob(input.replace(/\s/g, ''))
			const bytes = new Uint8Array(byteChars.length)
			for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
			return new Blob([bytes])
		}
	}

	throw new Error('Unsupported input type for image')
}

async function buildFormData(images: Partial<Record<ZoneUploadKey, unknown>>): Promise<FormData> {
	const fd = new FormData()
	;(['front', 'back', 'left', 'right'] as const).forEach(key => void key)
	const order: ZoneUploadKey[] = ['front', 'back', 'left', 'right']

	for (const key of order) {
		const val = images[key]
		if (!val) continue
		const blob = await blobFromInput(val)
		const filename = (blob as File).name || `${key}-${Date.now()}.jpg`
		fd.append(key, blob, filename)
	}
	return fd
}

/* =========================
   Service
   ========================= */

type AnalyzeOpts = {
	onUploadProgress?: (p: AxiosProgressEvent) => void
	signal?: AbortSignal
}

class ImageClassificationService {
	async analyzeCar(
		images: Partial<Record<ZoneUploadKey, unknown>>,
		opts: AnalyzeOpts = {},
	): Promise<CarAnalysisDto> {
		try {
			const fd = await buildFormData(images)
			// Important: pass the generic so Axios infers res.data correctly.
			const res = await apiClient.post<CarAnalysisDto>('/image-classification/analyze-car', fd, {
				onUploadProgress: opts.onUploadProgress,
				signal: opts.signal,
			})
			if (res.status >= 200 && res.status < 300) {
				// If your apiClient loses generics, uncomment the cast:
				// return res.data as CarAnalysisDto
				return res.data
			}
			throw new ImageClassificationServiceError(
				`Failed to analyze car. Status: ${res.status}`,
				res.status,
			)
		} catch (err) {
			if (isAxiosError(err)) {
				throw new ImageClassificationServiceError(
					err.response?.data?.message || err.message || 'Error analyzing car',
					err.response?.status,
				)
			}
			throw new ImageClassificationServiceError('Unknown error analyzing car', 500)
		}
	}

	async getLatestAnalysis(): Promise<CarAnalysisDto> {
		try {
			const res = await apiClient.get<CarAnalysisDto>('/image-classification/latest')
			if (res.status >= 200 && res.status < 300) {
				return res.data
			}
			throw new ImageClassificationServiceError(
				`Failed to fetch latest analysis. Status: ${res.status}`,
				res.status,
			)
		} catch (err) {
			if (isAxiosError(err)) {
				throw new ImageClassificationServiceError(
					err.response?.data?.message || err.message || 'Error fetching latest analysis',
					err.response?.status,
				)
			}
			throw new ImageClassificationServiceError('Unknown error fetching latest analysis', 500)
		}
	}

	async getAnalyses(): Promise<CarAnalysisDto[]> {
		try {
			const res = await apiClient.get<CarAnalysisDto[]>('/image-classification/analyses')
			if (res.status >= 200 && res.status < 300) {
				return res.data
			}
			throw new ImageClassificationServiceError(
				`Failed to fetch analyses. Status: ${res.status}`,
				res.status,
			)
		} catch (err) {
			if (isAxiosError(err)) {
				throw new ImageClassificationServiceError(
					err.response?.data?.message || err.message || 'Error fetching analyses',
					err.response?.status,
				)
			}
			throw new ImageClassificationServiceError('Unknown error fetching analyses', 500)
		}
	}

	async getAnalysisById(id: number): Promise<CarAnalysisDto> {
		try {
			const res = await apiClient.get<CarAnalysisDto>(`/image-classification/analyses/${id}`)
			if (res.status >= 200 && res.status < 300) {
				return res.data
			}
			throw new ImageClassificationServiceError(
				`Failed to fetch analysis #${id}. Status: ${res.status}`,
				res.status,
			)
		} catch (err) {
			if (isAxiosError(err)) {
				throw new ImageClassificationServiceError(
					err.response?.data?.message || err.message || `Error fetching analysis #${id}`,
					err.response?.status,
				)
			}
			throw new ImageClassificationServiceError('Unknown error fetching analysis', 500)
		}
	}
}

export const imageClassificationService = new ImageClassificationService()
