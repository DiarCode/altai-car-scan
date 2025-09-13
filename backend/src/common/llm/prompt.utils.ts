/* Utility helpers for building richer prompt context */
import { EXERCISE_TYPE } from '@prisma/client'

export interface TruncationNote {
	label: string
	shown: number
	total: number
}

export function formatVocabularyList(
	words: string[],
	limit: number,
	notes: TruncationNote[],
	label: string,
): string {
	if (!words.length) return 'NONE'
	const unique = Array.from(new Set(words))
	const total = unique.length
	const slice = unique.slice(0, limit)
	if (total > slice.length) {
		notes.push({ label, shown: slice.length, total })
	}
	return slice.join(', ')
}

export function summarizeExercisePayload(payload: any, maxChars: number): string {
	try {
		const json = JSON.stringify(payload)
		if (json.length <= maxChars) return json
		return json.slice(0, maxChars) + `… (truncated ${json.length - maxChars} chars)`
	} catch {
		return '[unserializable payload]'
	}
}

export function listExistingExercises(
	exercises: { id: number; type: EXERCISE_TYPE; title: string; payload: any }[],
	opts: { limit: number; maxChars: number },
	notes: TruncationNote[],
	label: string,
	filterType?: EXERCISE_TYPE,
): string {
	const filtered = filterType ? exercises.filter(e => e.type === filterType) : exercises
	const total = filtered.length
	if (!total) return 'NONE'
	const slice = filtered.slice(0, opts.limit)
	if (total > slice.length) notes.push({ label, shown: slice.length, total })
	return slice
		.map(
			e =>
				`• [${e.id}] ${e.type} :: "${e.title}" :: payload ${summarizeExercisePayload(
					e.payload,
					opts.maxChars,
				)}`,
		)
		.join('\n')
}

export function buildProtectedTerms(
	currentVocab: string[],
	previousVocab: string[],
	extra: string[],
): string[] {
	const combined = [...currentVocab, ...previousVocab, ...extra]
	const cleaned = combined.map(w => w.trim()).filter(w => !!w && /^[\p{L}\-']+$/u.test(w))
	return Array.from(new Set(cleaned)).sort((a, b) => b.length - a.length)
}

export function formatProtectedTerms(terms: string[]): string {
	if (!terms.length) return 'NONE'
	return terms.map(t => '"' + t + '"').join(', ')
}

export function formatTruncationNotes(notes: TruncationNote[]): string {
	if (!notes.length) return ''
	return notes.map(n => `${n.label}: showed ${n.shown} of ${n.total}`).join(' | ')
}

export function applyOptional(str: string, placeholder: string, value: string): string {
	if (str.includes(`{{${placeholder}}}`)) {
		return str.replace(new RegExp(`{{${placeholder}}}`, 'g'), value)
	}
	return str
}
