// Small runtime-safe helpers to avoid unsafe property access on unknown values
export function getStringProp(obj: unknown, key: string): string {
	if (typeof obj === 'object' && obj !== null && key in obj) {
		const rec = obj as Record<string, unknown>
		const v = rec[key]
		if (typeof v === 'string') return v
		if (typeof v === 'number' || typeof v === 'boolean') return String(v)
	}
	return ''
}

export function getBooleanProp(obj: unknown, key: string): boolean {
	if (typeof obj === 'object' && obj !== null && key in obj) {
		const rec = obj as Record<string, unknown>
		const v = rec[key]
		return Boolean(v)
	}
	return false
}
