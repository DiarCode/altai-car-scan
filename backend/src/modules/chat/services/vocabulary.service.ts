import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { ChatSessionService } from './chat-session.service'
import { ChatMessageService } from './chat-message.service'
import { ChatLLMAdapter } from '../adapters/chat-llm-adapter.interface'
import { SendCommandDto, ChatResponseDto } from '../dtos/chat.dtos'
import { ChatContextService } from './chat-context.service'
import { ChatContextScope, ChatMessageType, UserCommandType } from '../types/chat-flow.types'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { NATIVE_LANGUAGE, Prisma } from '@prisma/client'
import { ChatSessionDocument } from '../schemas/chat-session.schema'

@Injectable()
export class VocabularyService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sessionService: ChatSessionService,
		private readonly messageService: ChatMessageService,
		private readonly contextService: ChatContextService,
		@Inject('ChatLLMAdapter')
		private readonly llmAdapter: ChatLLMAdapter,
	) {}

	private async _getVocabularyExplanation(
		moduleId: number,
		word: string,
		nativeLanguage: NATIVE_LANGUAGE,
		session: ChatSessionDocument,
	): Promise<{ explanation: string; example: string | null }> {
		const vocabularyEntry = await this.prisma.moduleVocabulary.findFirst({
			where: {
				moduleId,
				word,
			},
			select: {
				translations: {
					select: {
						translation: true,
						description: true,
						language: true,
					},
				},
				example: true,
			},
		})

		let explanation: string
		let example: string | null = null

		type ModuleVocabularyWithTranslations = Prisma.ModuleVocabularyGetPayload<{
			select: {
				translations: {
					select: {
						translation: true
						description: true
						language: true
					}
				}
				example: true
			}
		}>

		if (vocabularyEntry) {
			const typedVocabularyEntry = vocabularyEntry as ModuleVocabularyWithTranslations
			const matchingTranslation = typedVocabularyEntry.translations.find(
				trans => trans.language === nativeLanguage,
			)
			if (matchingTranslation && matchingTranslation.description) {
				explanation = matchingTranslation.description
			} else if (
				typedVocabularyEntry.translations.length > 0 &&
				typedVocabularyEntry.translations[0].description
			) {
				// Fallback: use the first available description
				explanation = typedVocabularyEntry.translations[0].description
			} else {
				// Fallback to translation if no description is found
				explanation =
					matchingTranslation?.translation ||
					typedVocabularyEntry.translations[0]?.translation ||
					''
			}
			example = typedVocabularyEntry.example
		} else {
			const context = await this.contextService.buildChatContext(
				session,
				ChatContextScope.KAZAKH_LANGUAGE,
			)

			const response = await this.llmAdapter.generateExplanation(word, context)
			explanation = response.content
		}

		return { explanation, example }
	}

	async explainVocabulary(learner: LearnerClaims, dto: SendCommandDto): Promise<ChatResponseDto> {
		const session = await this.sessionService.getActiveSessionForLearner(learner.id)
		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}

		const { text } = dto
		if (!text) {
			throw new BadRequestException('Target text is required for explanation')
		}

		const { explanation } = await this._getVocabularyExplanation(
			Number(session.learningContext.moduleId),
			text,
			learner.nativeLanguage,
			session,
		)

		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId: learner.id,
			moduleId: session.learningContext.moduleId,
			type: ChatMessageType.AI_VOCABULARY_EXPLANATION,
			content: explanation,
			commandData: {
				command: UserCommandType.EXPLAIN,
				text,
				response: explanation,
			},
		})

		return {
			message: this.messageService.mapMessageToDto(message),
			session: this.sessionService.mapSessionToDto(session),
			allowedActions: [],
			context: {
				scope: null,
				hasRAGContext: false,
				responseTime: 0,
				tokensUsed: 0,
			},
		}
	}

	async memorizeVocabulary(learner: LearnerClaims, dto: SendCommandDto): Promise<ChatResponseDto> {
		const session = await this.sessionService.getActiveSessionForLearner(learner.id)

		if (!session) {
			throw new BadRequestException('No active session found for this learner')
		}

		const { text } = dto
		if (!text) {
			throw new BadRequestException('Target text is required for memorization')
		}

		const chatContext = await this.contextService.buildChatContext(
			session,
			ChatContextScope.KAZAKH_LANGUAGE,
		)
		// Use new adapter function for extracting vocabulary JSON
		const vocabJson = await this.llmAdapter.extractVocabularyJson(text, chatContext)
		if (!isLLMVocabularySchema(vocabJson)) {
			throw new BadRequestException('LLM did not return a valid vocabulary schema')
		}

		await this.prisma.learnerVocabulary.create({
			data: {
				learnerId: learner.id,
				word: vocabJson.word || text,
				description: vocabJson.description || '',
				example: vocabJson.example || null,
				translation: vocabJson.translation || '',
			},
		})

		// Localize field labels based on learner's native language
		const labels: Record<
			NATIVE_LANGUAGE,
			{ word: string; translation: string; description: string; example: string }
		> = {
			KAZAKH: {
				word: 'Сөз',
				translation: 'Аудармасы',
				description: 'Сипаттамасы',
				example: 'Мысал',
			},
			RUSSIAN: {
				word: 'Слово',
				translation: 'Перевод',
				description: 'Описание',
				example: 'Пример',
			},
			ENGLISH: {
				word: 'Word',
				translation: 'Translation',
				description: 'Description',
				example: 'Example',
			},
		}

		const learnerLabels = labels[learner.nativeLanguage] || labels.ENGLISH
		const beautified =
			`${learnerLabels.word}: ${vocabJson.word || text}\n` +
			`${learnerLabels.translation}: ${vocabJson.translation || ''}\n` +
			`${learnerLabels.description}: ${vocabJson.description || ''}\n` +
			`${learnerLabels.example}: ${vocabJson.example || ''}`

		const message = await this.messageService.createMessage({
			sessionId: session.sessionId,
			learnerId: learner.id,
			moduleId: session.learningContext.moduleId,
			type: ChatMessageType.AI_MEMORIZATION_TIP,
			content: beautified,
			commandData: {
				command: UserCommandType.MEMORIZE,
				text,
				response: beautified,
			},
		})

		return {
			message: this.messageService.mapMessageToDto(message),
			session: this.sessionService.mapSessionToDto(session),
			allowedActions: [],
			context: {
				scope: null,
				hasRAGContext: false,
				responseTime: 0,
				tokensUsed: 0,
			},
		}
	}

	async appendModuleVocabulary(
		moduleId: number,
		learnerId: number,
		language: NATIVE_LANGUAGE,
	): Promise<void> {
		const vocabularyEntries = await this.prisma.moduleVocabulary.findMany({
			where: { moduleId },
			select: {
				word: true,
				translations: {
					where: { language: language },
					select: {
						translation: true,
						description: true,
					},
				},
				example: true,
			},
		})

		await this.prisma.learnerVocabulary.createMany({
			data: vocabularyEntries.map(entry => ({
				learnerId,
				word: entry.word,
				description: entry.translations[0]?.description || '',
				example: entry.example || null,
				translation: entry.translations[0]?.translation || '',
			})),
			skipDuplicates: true, // Avoid duplicates in case of re-adding
		})
	}
}

// Type for LLM vocabulary schema
interface LLMVocabularySchema {
	word: string
	translation: string
	description: string
	example?: string
}

// Type guard for LLMVocabularySchema
function isLLMVocabularySchema(obj: unknown): obj is LLMVocabularySchema {
	if (obj && typeof obj === 'object') {
		const data = obj as Record<string, unknown>
		return (
			typeof data.word === 'string' &&
			typeof data.translation === 'string' &&
			typeof data.description === 'string' &&
			(typeof data.example === 'string' || data.example === undefined)
		)
	}
	return false
}
