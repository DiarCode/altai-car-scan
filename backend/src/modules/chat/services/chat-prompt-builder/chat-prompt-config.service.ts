import { Injectable } from '@nestjs/common'

function int(name: string, def: number): number {
	const v = process.env[name]
	if (!v) return def
	const n = parseInt(v, 10)
	return isNaN(n) ? def : n
}

function str(name: string, def: string): string {
	return process.env[name] || def
}

@Injectable()
export class ChatPromptConfigService {
	readonly historyWindow = int('CHAT_HISTORY_WINDOW', 12)
	readonly historyMaxTokens = int('CHAT_HISTORY_MAX_TOKENS', 3000)
	readonly summaryTriggerMessages = int('CHAT_SUMMARY_TRIGGER_MESSAGES', 40)
	readonly summaryMaxChars = int('CHAT_SUMMARY_MAX_CHARS', 2500)
	readonly vocabLimit = int('CHAT_VOCAB_LIMIT', 30)
	readonly segmentSummaryChars = int('CHAT_SEGMENT_SUMMARY_CHARS', 800)
	readonly exercisePayloadChars = int('CHAT_EXERCISE_PAYLOAD_CHARS', 800)
	readonly mistakesLimit = int('CHAT_MISTAKES_LIMIT', 5)
	readonly passThreshold = int('CHAT_PASS_THRESHOLD', 70)
	readonly includeCorrectAnswerPolicy = str('CHAT_INCLUDE_CORRECT_ANSWER', 'after_submission') // 'after_submission' | 'always'
	readonly correctAnswerMaxChars = int('CHAT_CORRECT_ANSWER_MAX_CHARS', 400)
	readonly systemMaxTokens = int('CHAT_SYSTEM_MAX_TOKENS', 6000)
	readonly vocabBlockMaxChars = int('CHAT_VOCAB_BLOCK_MAX_CHARS', 800)
	readonly interestSegmentSummaryChars = int('CHAT_INTEREST_SEGMENT_SUMMARY_CHARS', 500)
	readonly asyncSummarization = str('CHAT_ASYNC_SUMMARIZATION', 'true') === 'true'
}
