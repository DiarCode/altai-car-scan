import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isSentenceReorderPayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { SentenceReorderPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'
import { EXERCISE_TYPE } from '@prisma/client'
import { scoreByType } from '../utils/score.util'

export class SentenceReorderValidationStrategy
	implements ValidationStrategy<SentenceReorderPayload, ExerciseAnswer>
{
	async validate(
		payload: SentenceReorderPayload,
		answer: ExerciseAnswer,
		helpers: StrategyHelpers,
	) {
		if (!isSentenceReorderPayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid sentence reorder payload' }
		}
		if (!Array.isArray(answer)) {
			return { isCorrect: false, score: 0, feedback: 'Answer must be an array' }
		}
		const answerArr = Array.isArray(answer) ? (answer as string[]) : []
		const allUsed = payload.fragments.every(f => answerArr.includes(f))
		if (!allUsed) {
			return { isCorrect: false, score: 0, feedback: 'Not all fragments used' }
		}
		let positionalMatches = 0
		payload.fragments.forEach((frag, idx) => {
			if (answer[idx] === frag) positionalMatches++
		})
		const rawScore = positionalMatches / payload.fragments.length
		const score = Math.round(rawScore * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Evaluate the grammatical quality and correctness of the reordered sentence in ${helpers.language}. Original fragments: ${JSON.stringify(
			payload.fragments,
		)}. Learner order: ${JSON.stringify(answer)}. Provide concise feedback and a correct sentence.`
		const feedback = await helpers.callLLM(prompt, ctx)
		return { isCorrect: scoreByType(EXERCISE_TYPE.SENTENCE_REORDER, score), score, feedback }
	}
}
