export type WeeklySummaryTargetLanguage = 'Kazakh' | 'Russian' | 'English'

export interface WeeklySummaryInput {
	wordsLearnt: number
	exercises: { completed: number; failed: number }
	progress: { dailyTasksCompleted: number; days: number }
	/** Optional learner name for a more personal tone */
	name?: string
	/** Output language for the summary text */
	targetLanguage: WeeklySummaryTargetLanguage
}

export interface WeeklySummaryAdapter {
	/**
	 * Generate a concise weekly progress summary in the requested target language.
	 * Should return 2–3 plain‑text sentences, no markdown/emojis.
	 */
	summarize(input: WeeklySummaryInput): Promise<string>
}
