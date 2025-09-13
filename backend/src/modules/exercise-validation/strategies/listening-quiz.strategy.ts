import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isListeningQuizPayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { ListeningQuizPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers, ListeningOptionShape } from '../types/strategy.types'
import { getStringProp, getBooleanProp } from '../utils/property.util'
import { EXERCISE_TYPE } from '@prisma/client'
import { scoreByType } from '../utils/score.util'

export class ListeningQuizValidationStrategy
	implements ValidationStrategy<ListeningQuizPayload, ExerciseAnswer>
{
	async validate(payload: ListeningQuizPayload, answer: ExerciseAnswer, helpers: StrategyHelpers) {
		if (!isListeningQuizPayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid listening quiz payload' }
		}
		if (!Array.isArray(answer)) {
			return { isCorrect: false, score: 0, feedback: 'Answer must be an array' }
		}
		let correct = 0
		const perQ: string[] = []
		payload.questions.forEach((q, i) => {
			const idx = answer[i] as number
			const opt = q.options[idx]
			const optionsCast: ListeningOptionShape[] = Array.isArray(q.options)
				? q.options.map((o: unknown) => ({
						answer: getStringProp(o, 'answer'),
						correct: getBooleanProp(o, 'correct'),
					}))
				: []
			const right = optionsCast.find(o => o.correct)
			const optCast: ListeningOptionShape | undefined =
				opt && typeof opt === 'object'
					? { answer: getStringProp(opt, 'answer'), correct: getBooleanProp(opt, 'correct') }
					: undefined
			const ok = !!optCast && optCast.correct === true
			if (ok) {
				correct++
				perQ.push(`Q${i + 1}: correct`)
			} else {
				perQ.push(`Q${i + 1}: expected ${right ? right.answer : 'N/A'}`)
			}
		})
		const score = Math.round((correct / payload.questions.length) * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Provide brief feedback for a listening quiz in ${helpers.language}. Indicate incorrect answers and suggest listening tips. Questions meta: ${JSON.stringify(
			payload.questions.map(q => ({ question: q.question })),
		)}. Learner indices: ${JSON.stringify(answer)}.`
		const feedback = await helpers.callLLM(prompt, ctx)
		return {
			isCorrect: scoreByType(EXERCISE_TYPE.LISTENING_QUIZ, score),
			score,
			feedback,
			detailedFeedback: { explanation: perQ.join('\n') },
		}
	}
}
