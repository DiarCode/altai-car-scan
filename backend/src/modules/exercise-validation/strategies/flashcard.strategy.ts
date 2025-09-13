import { isFlashcardPayload } from 'src/modules/exercises/adapters/exercise-types.guards'
import { FlashcardPayload } from 'src/modules/exercises/dtos/exercise-payload.types'
import { ValidationStrategy, StrategyHelpers } from '../types/strategy.types'

export class FlashcardValidationStrategy
	implements ValidationStrategy<FlashcardPayload, null | string>
{
	async validate(payload: FlashcardPayload, _answer: null | string, helpers: StrategyHelpers) {
		if (!isFlashcardPayload(payload)) {
			return { isCorrect: false, score: 0, feedback: 'Invalid flashcard payload' }
		}
		const ctx = helpers.buildLLMContext({})
		const prompt = `Provide a concise (max 2 sentences) reinforcement for the reviewed flashcards in ${helpers.language}. Cards: ${payload.cards
			.map(c => `${c.word}: ${c.definition}`)
			.join('; ')}`
		const feedback = await helpers.callLLM(prompt, ctx)
		return { isCorrect: true, score: 100, feedback }
	}
}
