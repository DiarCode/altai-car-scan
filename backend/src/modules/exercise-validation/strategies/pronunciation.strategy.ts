import { EXERCISE_TYPE } from '@prisma/client'
import { ExerciseAnswer, ExerciseValidationResult } from 'src/modules/chat/types/chat-flow.types'
import { PronunciationPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'
import { scoreByType } from '../utils/score.util'
import { levenshtein, wordDiff } from '../utils/string.util'

export class PronunciationValidationStrategy
	implements ValidationStrategy<PronunciationPayload, ExerciseAnswer>
{
	async validate(
		payload: PronunciationPayload,
		answer: ExerciseAnswer,
		helpers: StrategyHelpers,
	): Promise<ExerciseValidationResult> {
		const extractTranscript = (
			ans: ExerciseAnswer,
		): { transcript: string; confidence?: number } => {
			if (typeof ans === 'string') return { transcript: ans }
			if (ans && typeof ans === 'object') {
				const a = ans as { transcript?: string; confidence?: number }
				return { transcript: a.transcript ?? '', confidence: a.confidence }
			}
			return { transcript: '' }
		}

		const target = this._normalizeText(payload.text)
		let { transcript, confidence } = extractTranscript(answer)

		if ((!transcript || !transcript.trim()) && typeof helpers.getLatestAttemptASR === 'function') {
			const asr = await helpers.getLatestAttemptASR()
			if (asr?.transcript) {
				transcript = asr.transcript
				if (typeof asr.confidence === 'number') confidence = asr.confidence
			}
		}
		const said = this._normalizeText(transcript)

		const targetWords = target.split(' ').filter(Boolean)
		const saidWords = said.split(' ').filter(Boolean)

		const edit = levenshtein(saidWords, targetWords)
		const wer = targetWords.length > 0 ? edit / targetWords.length : 1
		let score = Math.max(0, Math.round((1 - wer) * 100))
		if (typeof confidence === 'number' && !Number.isNaN(confidence)) {
			const confPct = Math.max(0, Math.min(1, confidence)) * 100
			score = Math.round(score * 0.85 + confPct * 0.15)
		}

		const isCorrect = scoreByType(EXERCISE_TYPE.PRONUNCIATION, score)

		const ctx = helpers.buildLLMContext({})
		const prompt = `You are a pronunciation coach.
Language: ${helpers.language}.
Reference text: "${payload.text}".
ASR transcript: "${transcript}".
Provide concise feedback (2-4 sentences):
- Point out missing or extra words.
- Give 1-2 tips on articulation, stress or pace.
- Be supportive and specific.
Return plain text.`
		const feedback = await helpers.callLLM(prompt, ctx)

		const diffs = wordDiff(targetWords, saidWords)

		return {
			isCorrect,
			score,
			feedback,
			detailedFeedback: {
				correctAnswer: payload.text,
				explanation: diffs,
			},
		}
	}

	private _normalizeText(s: string): string {
		return (s || '')
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[\p{P}\p{S}]/gu, ' ')
			.replace(/\s+/g, ' ')
			.trim()
	}
}
