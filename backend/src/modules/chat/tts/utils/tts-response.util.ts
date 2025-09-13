export function arrayBufferToString(ab: ArrayBuffer | Buffer): string {
	return Buffer.isBuffer(ab) ? ab.toString('utf8') : Buffer.from(ab).toString('utf8')
}

export function parseJsonFromArrayBuffer(ab: ArrayBuffer | Buffer): unknown {
	const txt = arrayBufferToString(ab)
	return JSON.parse(txt)
}

export function extractBase64FromJson(root: unknown): string | undefined {
	if (!root || typeof root !== 'object') return undefined
	const obj = root as Record<string, unknown>

	const tryProp = (o: Record<string, unknown>, name: string): string | undefined => {
		const v = o[name]
		return typeof v === 'string' ? v : undefined
	}

	let found = tryProp(obj, 'audio_base64') ?? tryProp(obj, 'audio') ?? tryProp(obj, 'base64')
	if (found) return found

	const data = obj['data']
	if (data && typeof data === 'object') {
		const d = data as Record<string, unknown>
		found = tryProp(d, 'audio_base64') ?? tryProp(d, 'audio') ?? tryProp(d, 'base64')
		if (found) return found
	}

	return undefined
}
