export function buildSynthesizeUrl(base: string): string {
	let b = String(base || '').trim()
	if (!b) return ''
	if (b.endsWith('/')) b = b.slice(0, -1)
	if (b.toLowerCase().endsWith('/synthesize-json')) return b
	return `${b}/synthesize-json`
}
