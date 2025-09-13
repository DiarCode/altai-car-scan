export function levenshtein(a: string[], b: string[]): number {
	const m = a.length
	const n = b.length
	if (m === 0) return n
	if (n === 0) return m
	const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
	for (let i = 0; i <= m; i++) dp[i][0] = i
	for (let j = 0; j <= n; j++) dp[0][j] = j
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1
			dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
		}
	}
	return dp[m][n]
}

export function wordDiff(target: string[], said: string[]): string {
	const missing: string[] = []
	const extra: string[] = []
	const targetSet = new Map<string, number>()
	for (const w of target) targetSet.set(w, (targetSet.get(w) || 0) + 1)
	const saidSet = new Map<string, number>()
	for (const w of said) saidSet.set(w, (saidSet.get(w) || 0) + 1)
	for (const [w, cnt] of targetSet) {
		const diff = cnt - (saidSet.get(w) || 0)
		if (diff > 0) {
			const toAdd: string[] = Array.from({ length: diff }, () => w)
			missing.push(...toAdd)
		}
	}
	for (const [w, cnt] of saidSet) {
		const diff = cnt - (targetSet.get(w) || 0)
		if (diff > 0) {
			const toAdd: string[] = Array.from({ length: diff }, () => w)
			extra.push(...toAdd)
		}
	}
	const missingStr = missing.length ? `Missing: ${missing.slice(0, 10).join(', ')}` : ''
	const extraStr = extra.length ? `Extra: ${extra.slice(0, 10).join(', ')}` : ''
	return [missingStr, extraStr].filter(Boolean).join(' | ')
}
