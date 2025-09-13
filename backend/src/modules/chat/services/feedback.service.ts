// src/modules/chat/services/feedback.service.ts
import { Inject, Injectable } from '@nestjs/common'
import { ChatLLMAdapter, ChatContext } from '../adapters/chat-llm-adapter.interface'
import { ExerciseAttempt } from '../schemas/exercise-attempt.schema'
import { NATIVE_LANGUAGE } from '@prisma/client'
import { ChatContextScope } from '../types/chat-flow.types'
import { ExerciseDto } from 'src/modules/exercises/dtos/exercises.dtos'
import {
	isClozePayload,
	isDictationPayload,
	isFlashcardPayload,
	isListeningQuizPayload,
	isMultipleChoicePayload,
	isPictureDescriptionPayload,
	isPronunciationPayload,
	isSentenceReorderPayload,
} from 'src/modules/exercises/adapters/exercise-types.guards'

@Injectable()
export class FeedbackService {
	constructor(@Inject('ChatLLMAdapter') private readonly llmAdapter: ChatLLMAdapter) {}

	async generateFeedback(
		attempt: ExerciseAttempt,
		exercise: ExerciseDto,
		language: NATIVE_LANGUAGE,
		learnerId: number,
		moduleId: number,
	): Promise<string> {
		const prompt = this.buildPrompt(attempt, exercise, language)
		const context: ChatContext = {
			learnerId,
			moduleId,
			exerciseId: exercise.id,
			learnerLanguage: language,
			learnerInterests: [], // This can be enhanced later
			scope: ChatContextScope.CURRENT_EXERCISE,
			previousMessages: [],
			currentContent: {
				exerciseTitle: exercise.title,
				exerciseContent: this.getPayload(exercise),
			},
		}
		const feedback = await this.llmAdapter.generateResponse(prompt, context)
		return feedback.content
	}

	private getPayload(exercise: ExerciseDto): unknown {
		if ('payload' in exercise) {
			const { payload } = exercise
			if (isFlashcardPayload(payload)) return payload
			if (isClozePayload(payload)) return payload
			if (isSentenceReorderPayload(payload)) return payload
			if (isMultipleChoicePayload(payload)) return payload
			if (isDictationPayload(payload)) return payload
			if (isListeningQuizPayload(payload)) return payload
			if (isPronunciationPayload(payload)) return payload
			if (isPictureDescriptionPayload(payload)) return payload
		}
		return null
	}

	private buildPrompt(
		attempt: ExerciseAttempt,
		exercise: ExerciseDto,
		language: NATIVE_LANGUAGE,
	): string {
		const { isCorrect, answer } = attempt
		const { title } = exercise
		const payload = this.getPayload(exercise)

		let prompt = `The user has just completed the exercise titled "${title}".\n`
		prompt += `The user's answer was ${isCorrect ? 'correct' : 'incorrect'}.\n`
		prompt += `User's answer: ${JSON.stringify(answer)}\n`
		prompt += `Exercise details: ${JSON.stringify(payload)}\n\n`

		// Preserve correctness branching but require a short, 3-line response from the LLM.
		if (isCorrect) {
			prompt += `Please provide positive reinforcement and briefly explain why the answer is correct. Mention alternative solutions if applicable. `
			prompt += `Return exactly three lines: 1) one-sentence diagnosis of why the answer is correct; 2) one-line suggestion to extend learning; 3) one short practice suggestion. Reply in ${language}. Do not add examples or long explanations.`
		} else {
			prompt += `Please explain the user's mistake and provide a clear explanation of the correct answer. Offer some hints or a strategy for improvement. `
			prompt += `Return exactly three lines: 1) one-sentence diagnosis of the learner's mistake; 2) one-line actionable fix; 3) one short practice suggestion. Reply in ${language}. Do not add examples or long explanations.`
		}

		return prompt
	}
}
