import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PrismaService } from 'src/prisma/prisma.service'
import { EXERCISE_TYPE, NATIVE_LANGUAGE } from '@prisma/client'
import { ExerciseValidationResult, ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { ChatLLMAdapter, ChatContext } from 'src/modules/chat/adapters/chat-llm-adapter.interface'
import { ChatContextScope } from 'src/modules/chat/types/chat-flow.types'
import {
	ExerciseAttempt,
	ExerciseAttemptDocument,
} from 'src/modules/chat/schemas/exercise-attempt.schema'
import { ClozeValidationStrategy } from './strategies/cloze.strategy'
import { MultipleChoiceValidationStrategy } from './strategies/multiple-choice.strategy'
import { SentenceReorderValidationStrategy } from './strategies/sentence-reorder.strategy'
import { ValidationStrategy, StrategyHelpers } from './types/strategy.types'
import { DictationValidationStrategy } from './strategies/dictation.strategy'
import { FlashcardValidationStrategy } from './strategies/flashcard.strategy'
import { ListeningQuizValidationStrategy } from './strategies/listening-quiz.strategy'
import { PictureDescriptionValidationStrategy } from './strategies/picture-description.strategy'
import { PronunciationValidationStrategy } from './strategies/pronunciation.strategy'

@Injectable()
export class ExerciseValidationService {
	private readonly logger = new Logger(ExerciseValidationService.name)
	private readonly strategies: Map<EXERCISE_TYPE, ValidationStrategy<any, any>>

	constructor(
		private readonly prisma: PrismaService,
		@Inject('ChatLLMAdapter') private readonly llmAdapter: ChatLLMAdapter,
		@InjectModel(ExerciseAttempt.name)
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
	) {
		this.strategies = new Map()
		// Reuse the existing strategy implementations by importing them from chat module file
		// to minimize code changes during initial extract. We'll keep implementations here for now.
		this.strategies.set(EXERCISE_TYPE.FLASHCARD, new FlashcardValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.CLOZE, new ClozeValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.SENTENCE_REORDER, new SentenceReorderValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.MULTIPLE_CHOICE, new MultipleChoiceValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.DICTATION, new DictationValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.LISTENING_QUIZ, new ListeningQuizValidationStrategy())
		this.strategies.set(EXERCISE_TYPE.PRONUNCIATION, new PronunciationValidationStrategy())
		this.strategies.set(
			EXERCISE_TYPE.PICTURE_DESCRIPTION,
			new PictureDescriptionValidationStrategy(),
		)
	}

	async validateAnswer(
		exerciseId: number,
		answer: ExerciseAnswer,
		isDontKnow: boolean = false,
		language: NATIVE_LANGUAGE = NATIVE_LANGUAGE.ENGLISH,
		contextExtras: Partial<ChatContext> = {},
	): Promise<ExerciseValidationResult> {
		if (isDontKnow) {
			return {
				isCorrect: false,
				score: 0,
				feedback: 'You chose "I don\'t know". Review the content. Do you want deeper explanation?',
			}
		}

		const exercise = await this.prisma.exercise.findUnique({
			where: { id: exerciseId },
			select: { id: true, title: true, type: true, payload: true, interestSegmentId: true },
		})

		if (!exercise) {
			throw new Error(`Exercise ${exerciseId} not found`)
		}

		const strategy = this.strategies.get(exercise.type)
		if (!strategy) {
			throw new Error(`No validation strategy for type ${exercise.type}`)
		}

		const helpers: StrategyHelpers = {
			language,
			buildLLMContext: extra => ({
				learnerId: contextExtras.learnerId ?? 0,
				moduleId: contextExtras.moduleId ?? 0,
				segmentId: contextExtras.segmentId,
				exerciseId: exercise.id,
				learnerLanguage: language,
				learnerInterests: contextExtras.learnerInterests ?? [],
				scope: ChatContextScope.CURRENT_EXERCISE,
				previousMessages: [],
				currentContent: {
					exerciseTitle: exercise.title,
					exerciseContent: exercise.payload,
				},
				...extra,
			}),
			callLLM: async (prompt, ctx) => {
				try {
					const res = await this.llmAdapter.generateResponse(prompt, ctx)
					return res.content
				} catch (e) {
					this.logger.error(`LLM validation failed: ${e instanceof Error ? e.message : e}`)
					return 'LLM validation unavailable. Using heuristic fallback.'
				}
			},
			getLatestAttemptASR: async () => {
				const query: Record<string, number> = { exerciseId: exercise.id }
				if (contextExtras.learnerId) query.learnerId = contextExtras.learnerId
				const doc = await this.attemptModel
					.findOne(query)
					.sort({ createdAt: -1 })
					.select({ asrResult: 1, _id: 0 })
					.lean<{ asrResult?: { transcript?: string; confidence?: number } }>()
				return doc?.asrResult ?? null
			},
		}

		return strategy.validate(exercise.payload, answer, helpers)
	}
}
