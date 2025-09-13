import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isClozePayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { ClozePayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'
import { EXERCISE_TYPE } from '@prisma/client'
import { scoreByType } from '../utils/score.util'

export class ClozeValidationStrategy implements ValidationStrategy<ClozePayload, ExerciseAnswer> {
	async validate(payload: ClozePayload, answer: ExerciseAnswer, helpers: StrategyHelpers) {
		if (!isClozePayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid cloze payload' }
		}
		if (!Array.isArray(answer)) {
			return { isCorrect: false, score: 0, feedback: 'Answer must be an array of strings' }
		}
		let correctCount = 0
		const details: string[] = []
		payload.sentences.forEach((s, i) => {
			const user = (answer[i] ?? '').toString().trim().toLowerCase()
			const accepted = s.answers.map(a => a.trim().toLowerCase())
			if (accepted.includes(user)) {
				correctCount++
				details.push(`Sentence ${i + 1}: OK`)
			} else {
				details.push(`Sentence ${i + 1}: expected one of: ${s.answers.join(', ')}`)
			}
		})
		const score = Math.round((correctCount / payload.sentences.length) * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Evaluate the learner cloze answers. Provide a short formative feedback in ${helpers.language}. Payload: ${JSON.stringify(
			payload.sentences.map(s => ({ text: s.text, answers: s.answers })),
		)}. Learner answers: ${JSON.stringify(answer)}. Mention common mistakes briefly.`
		const llmFeedback = await helpers.callLLM(prompt, ctx)
		return {
			isCorrect: scoreByType(EXERCISE_TYPE.CLOZE, score),
			score,
			feedback: llmFeedback,
			detailedFeedback: {
				correctAnswer: payload.sentences.map(s => s.answers),
				explanation: details.join('\n'),
			},
		}
	}
}
