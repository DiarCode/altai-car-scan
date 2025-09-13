import { ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { isPictureDescriptionPayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { PictureDescriptionPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'
import { scoreByType } from '../utils/score.util'
import { EXERCISE_TYPE } from '@prisma/client'

export class PictureDescriptionValidationStrategy
	implements ValidationStrategy<PictureDescriptionPayload, ExerciseAnswer>
{
	async validate(
		payload: PictureDescriptionPayload,
		answer: ExerciseAnswer,
		helpers: StrategyHelpers,
	) {
		if (!isPictureDescriptionPayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid picture description payload' }
		}
		const user = (answer as string)?.toLowerCase() || ''
		const found = payload.expectedKeywords.filter(k => user.includes(k.toLowerCase()))
		const score = Math.round((found.length / Math.max(payload.expectedKeywords.length, 1)) * 100)
		const ctx = helpers.buildLLMContext({})
		const prompt = `Evaluate the learner's picture description in ${helpers.language}. Expected keywords: ${payload.expectedKeywords.join(', ')}. Description: "${user}". Provide concise feedback and missing concept hints.`
		const feedback = await helpers.callLLM(prompt, ctx)
		return {
			isCorrect: scoreByType(EXERCISE_TYPE.PICTURE_DESCRIPTION, score),
			score,
			feedback,
			detailedFeedback: {
				explanation: `Found: ${found.join(', ')}`,
				hints: payload.expectedKeywords
					.filter(k => !found.includes(k))
					.map(k => `Try to mention: ${k}`),
			},
		}
	}
}
