import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isDictationPayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { DictationPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'
import { EXERCISE_TYPE } from '@prisma/client'
import { scoreByType } from '../utils/score.util'

export class DictationValidationStrategy
	implements ValidationStrategy<DictationPayload, ExerciseAnswer>
{
	async validate(payload: DictationPayload, answer: ExerciseAnswer, helpers: StrategyHelpers) {
		if (!isDictationPayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid dictation payload' }
		}
		const user = (answer as string)?.trim() || ''
		const target = payload.transcript.trim()
		const wordsUser = user.toLowerCase().split(/\s+/)
		const wordsTarget = target.toLowerCase().split(/\s+/)
		const matches = wordsUser.filter(w => wordsTarget.includes(w)).length
		const score = Math.round((matches / Math.max(wordsTarget.length, 1)) * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Compare learner dictation to reference. Language: ${helpers.language}. Reference: "${target}" Learner: "${user}". Provide short feedback highlighting main differences and corrections.`
		const feedback = await helpers.callLLM(prompt, ctx)
		return {
			isCorrect: scoreByType(EXERCISE_TYPE.DICTATION, score),
			score,
			feedback,
			detailedFeedback: { correctAnswer: target },
		}
	}
}
