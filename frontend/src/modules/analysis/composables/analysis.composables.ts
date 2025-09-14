// src/modules/analysis/composables/image-classification.composables.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type MaybeRef, type Ref, computed, ref, unref } from 'vue'

import type { BaseQueryOptions } from '@/core/configs/query-client.config'

import type { AnalyzeCarFiles, AnalyzeCarOptions, CarAnalysisDto } from '../models/analysis.models'
import {
	ImageClassificationServiceError,
	imageClassificationService,
} from '../services/analysis.services'

/* =========================
   QUERY KEYS
   ========================= */
export const IMAGE_CLASSIFICATION_QUERY_KEYS = {
	latest: ['image-classification', 'latest'] as const,
	list: ['image-classification', 'analyses'] as const,
	detail: (id: number) => ['image-classification', 'analyses', id] as const,
	analyze: ['image-classification', 'analyze'] as const, // ephemeral (devtools)
} as const

/* =========================
   QUERIES
   ========================= */

/** Latest saved analysis for the current user */
export const useLatestAnalysis = (queryOptions?: BaseQueryOptions<CarAnalysisDto>) => {
	return useQuery({
		queryKey: computed(() => IMAGE_CLASSIFICATION_QUERY_KEYS.latest),
		queryFn: () => imageClassificationService.getLatestAnalysis(),
		refetchOnWindowFocus: false,
		...queryOptions,
	})
}

/** All analyses for the current user (simple list) */
export const useAnalysesList = (queryOptions?: BaseQueryOptions<CarAnalysisDto[]>) => {
	return useQuery({
		queryKey: computed(() => IMAGE_CLASSIFICATION_QUERY_KEYS.list),
		queryFn: () => imageClassificationService.getAnalyses(),
		refetchOnWindowFocus: false,
		...queryOptions,
	})
}

/** Single analysis by id */
export const useAnalysis = (
	id: MaybeRef<number | undefined>,
	queryOptions?: BaseQueryOptions<CarAnalysisDto>,
) => {
	const resolvedId = computed(() => unref(id))
	return useQuery({
		queryKey: computed(() =>
			resolvedId.value
				? IMAGE_CLASSIFICATION_QUERY_KEYS.detail(resolvedId.value)
				: (['image-classification', 'analyses', 'none'] as const),
		),
		queryFn: () => imageClassificationService.getAnalysisById(resolvedId.value as number),
		enabled: computed(() => !!resolvedId.value),
		refetchOnWindowFocus: false,
		...queryOptions,
	})
}

/** Prefetch helpers (handy in guards, beforeRouteEnter, etc.) */
export const usePrefetchLatest = () => {
	const qc = useQueryClient()
	return () =>
		qc.prefetchQuery({
			queryKey: IMAGE_CLASSIFICATION_QUERY_KEYS.latest,
			queryFn: () => imageClassificationService.getLatestAnalysis(),
		})
}

export const usePrefetchAnalysis = () => {
	const qc = useQueryClient()
	return (id: number) =>
		qc.prefetchQuery({
			queryKey: IMAGE_CLASSIFICATION_QUERY_KEYS.detail(id),
			queryFn: () => imageClassificationService.getAnalysisById(id),
		})
}

/* =========================
   MUTATIONS
   ========================= */

/**
 * Analyze car images (1–4 files). Invalidates:
 *  - latest analysis
 *  - list of analyses
 */
export const useAnalyzeCar = () => {
	const qc = useQueryClient()

	return useMutation<
		CarAnalysisDto,
		ImageClassificationServiceError,
		{ files: AnalyzeCarFiles; options?: AnalyzeCarOptions }
	>({
		mutationKey: IMAGE_CLASSIFICATION_QUERY_KEYS.analyze,
		mutationFn: ({ files, options }) => imageClassificationService.analyzeCar(files, options),
		onSuccess: async created => {
			// keep cache coherent
			await Promise.all([
				qc.invalidateQueries({ queryKey: IMAGE_CLASSIFICATION_QUERY_KEYS.latest }),
				qc.invalidateQueries({ queryKey: IMAGE_CLASSIFICATION_QUERY_KEYS.list }),
				qc.setQueryData(IMAGE_CLASSIFICATION_QUERY_KEYS.detail(created.id), created),
			])
		},
	})
}

/**
 * Same as `useAnalyzeCar`, but exposes a progress ref (0–100)
 * and a cancel() with AbortController.
 */
export const useAnalyzeCarWithProgress = () => {
	const progress: Ref<number> = ref(0)
	const controller = new AbortController()

	const mutation = useAnalyzeCar()

	const analyze = (files: AnalyzeCarFiles) =>
		mutation.mutateAsync({
			files,
			options: {
				signal: controller.signal,
				onUploadProgress: e => {
					const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0
					progress.value = pct
				},
			},
		})

	const cancel = () => controller.abort()

	return {
		...mutation,
		analyze,
		progress,
		cancel,
	}
}
