import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isMultipleChoicePayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { MultipleChoicePayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import {
	ValidationStrategy,
	StrategyHelpers,
	MultipleChoiceOptionShape,
} from '../types/strategy.types'
import { getStringProp, getBooleanProp } from '../utils/property.util'
import { EXERCISE_TYPE } from '@prisma/client'
import { scoreByType } from '../utils/score.util'

export class MultipleChoiceValidationStrategy
	implements ValidationStrategy<MultipleChoicePayload, ExerciseAnswer>
{
	async validate(payload: MultipleChoicePayload, answer: ExerciseAnswer, helpers: StrategyHelpers) {
		if (!isMultipleChoicePayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid multiple choice payload' }
		}
		if (!Array.isArray(answer)) {
			return { isCorrect: false, score: 0, feedback: 'Answer must be an array of option indices' }
		}
		let correct = 0
		const perQ: string[] = []
		payload.questions.forEach((q, i) => {
			const idx = answer[i] as number
			const opt = q.options && Array.isArray(q.options) ? q.options[idx] : undefined
			const optionList: MultipleChoiceOptionShape[] = Array.isArray(q.options)
				? q.options.map((o: unknown) => ({
						answer: getStringProp(o, 'answer'),
						isCorrect: getBooleanProp(o, 'isCorrect'),
						correct: getBooleanProp(o, 'correct'),
					}))
				: []
			const correctOpt = optionList.find(o => o.isCorrect === true || o.correct === true)
			const optShape: MultipleChoiceOptionShape | undefined =
				opt && typeof opt === 'object'
					? {
							answer: getStringProp(opt, 'answer'),
							isCorrect: getBooleanProp(opt, 'isCorrect'),
							correct: getBooleanProp(opt, 'correct'),
						}
					: undefined
			const isCorrect = !!(optShape && (optShape.isCorrect === true || optShape.correct === true))
			if (isCorrect) {
				correct++
				perQ.push(`Q${i + 1}: correct`)
			} else {
				perQ.push(`Q${i + 1}: expected ${correctOpt ? correctOpt.answer : 'N/A'}`)
			}
		})
		const score = Math.round((correct / payload.questions.length) * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Provide concise feedback (max 4 sentences) for a multiple-choice quiz in ${helpers.language}. Questions: ${JSON.stringify(
			payload.questions.map(q => ({
				question: q.question,
				options: Array.isArray(q.options)
					? q.options.map((o: unknown) => getStringProp(o, 'answer'))
					: [],
			})),
		)}. Learner selected indices: ${JSON.stringify(answer)}. Indicate which are wrong and why briefly.`
		const feedback = await helpers.callLLM(prompt, ctx)
		return {
			isCorrect: scoreByType(EXERCISE_TYPE.MULTIPLE_CHOICE, score),
			score,
			feedback,
			detailedFeedback: { explanation: perQ.join('\n') },
		}
	}
}
