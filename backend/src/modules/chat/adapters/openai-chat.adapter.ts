// src/modules/chat/adapters/openai-chat.adapter.ts

import { Injectable, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { AppConfigService } from 'src/common/config/config.service'
import { ChatLLMAdapter, ChatContext, ChatResponse } from './chat-llm-adapter.interface'
import { ChatContextScope } from '../types/chat-flow.types'
import { ChatPromptBuilderService } from '../services/chat-prompt-builder/chat-prompt-builder.service'

@Injectable()
export class OpenAIChatAdapter implements ChatLLMAdapter {
	private readonly logger = new Logger(OpenAIChatAdapter.name)
	private readonly client: OpenAI
	private readonly model: string

	constructor(
		private readonly config: AppConfigService,
		private readonly promptBuilder: ChatPromptBuilderService,
	) {
		this.client = new OpenAI({ apiKey: config.openai.apiKey })
		this.model = config.openai.model
	}

	/**
	 * Generate and parse a JSON schema for a vocabulary word (word, translation, description, example)
	 * Returns a parsed object, not a string.
	 */
	async extractVocabularyJson(
		word: string,
		context: ChatContext,
	): Promise<{ word: string; translation: string; description: string; example?: string }> {
		const prompt = [
			`You are a Kazakh language teaching assistant.`,
			`Generate a JSON object for the following Kazakh vocabulary word.`,
			`The JSON must have these keys:`,
			`- word: the Kazakh word`,
			`- translation: translation in the learner's native language`,
			`- description: a short definition in the learner's native language`,
			`- example: a Kazakh sentence using the word`,
			`Return ONLY valid JSON, no explanation, no markdown, no extra text.`,
			`Word: "${word}"`,
		].join('\n')
		const enhancedContext = {
			...context,
			scope: ChatContextScope.KAZAKH_LANGUAGE,
		}
		const response = await this.generateResponse(prompt, enhancedContext)
		let parsed: { word: string; translation: string; description: string; example?: string }
		try {
			parsed =
				typeof response.content === 'string'
					? (JSON.parse(response.content) as {
							word: string
							translation: string
							description: string
							example?: string
						})
					: response.content
		} catch {
			throw new Error('Failed to parse LLM vocabulary JSON')
		}
		return parsed
	}

	async generateResponse(userMessage: string, context: ChatContext): Promise<ChatResponse> {
		const startTime = Date.now()

		try {
			// Build richer messages via prompt builder (Phase 1 minimal)
			let messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
			if (context._internalSession) {
				const internal = await this.promptBuilder.buildInternalContext(
					context._internalSession,
					context,
					context.previousMessages,
					undefined,
				)
				messages = this.promptBuilder.buildMessages(userMessage, internal)
				// basic observability logging
				try {
					const systemMsg = messages[0]?.content || ''
					const approxTokens =
						Math.ceil(systemMsg.length / 4) +
						messages.slice(1).reduce((s, m) => s + Math.ceil(m.content.length / 4), 0)
					this.logger.debug(
						`ChatPrompt: chars=${systemMsg.length} totalMsgs=${messages.length} estTokens=${approxTokens}`,
					)
				} catch {
					// swallow logging errors
				}
			} else {
				messages = this.promptBuilder.buildMessages(userMessage, {
					moduleBlock: undefined,
					segmentBlock: undefined,
					exerciseBlock: undefined,
					performanceBlock: undefined,
					nextBlock: undefined,
					longTermSummaryBlock: undefined,
					profileBlock: undefined,
					historyMessages: context.previousMessages.map(m => ({
						role: m.role,
						content: m.content,
					})),
				})
			}

			const response = await this.client.chat.completions.create({
				model: this.model,
				messages,
				max_tokens: 2048,
				temperature: 0.7,
				top_p: 0.9,
			})

			const responseTime = Date.now() - startTime
			const content = response.choices[0]?.message?.content || ''

			return {
				content,
				metadata: {
					model: this.model,
					tokensUsed: response.usage?.total_tokens || 0,
					responseTime,
					confidence: this.calculateConfidence(response),
					sources: this.extractSources(context),
					contextScope: context.scope,
				},
			}
		} catch (error) {
			this.logger.error('Error generating response:', error)
			throw error
		}
	}

	async generateExplanation(content: string, context: ChatContext): Promise<ChatResponse> {
		const explanationPrompt = `Please explain the following Kazakh language content in detail: "${content}"`

		const enhancedContext = {
			...context,
			scope: ChatContextScope.KAZAKH_LANGUAGE,
		}

		return this.generateResponse(explanationPrompt, enhancedContext)
	}

	async generateMemorizationTips(content: string, context: ChatContext): Promise<ChatResponse> {
		const memorizationPrompt = `Please provide memorization tips and techniques for learning this Kazakh language content: "${content}"`

		const enhancedContext = {
			...context,
			scope: ChatContextScope.KAZAKH_LANGUAGE,
		}

		return this.generateResponse(memorizationPrompt, enhancedContext)
	}

	async generateHelpResponse(context: ChatContext): Promise<ChatResponse> {
		const helpPrompt = `The user needs help with their Kazakh language learning. Provide guidance based on their current context.`

		const enhancedContext = {
			...context,
			scope: ChatContextScope.GENERAL_LEARNING,
		}

		return this.generateResponse(helpPrompt, enhancedContext)
	}

	async validateQuestionScope(
		userMessage: string,
		context: ChatContext,
	): Promise<{
		isValid: boolean
		scope: ChatContextScope
		reason?: string
	}> {
		await Promise.resolve()
		// Basic validation - in production, you might want to use a separate model for this
		const kazakhLanguageKeywords = [
			'kazakh',
			'қазақ',
			'grammar',
			'vocabulary',
			'pronunciation',
			'translation',
			'meaning',
			'explain',
			'how to say',
		]

		const learningKeywords = [
			'learn',
			'study',
			'practice',
			'exercise',
			'lesson',
			'homework',
			'test',
			'quiz',
			'help',
			'understand',
		]

		const lowerMessage = userMessage.toLowerCase()

		// Check if question is about Kazakh language
		if (kazakhLanguageKeywords.some(keyword => lowerMessage.includes(keyword))) {
			return {
				isValid: true,
				scope: ChatContextScope.KAZAKH_LANGUAGE,
			}
		}

		// Check if question is about learning
		if (learningKeywords.some(keyword => lowerMessage.includes(keyword))) {
			return {
				isValid: true,
				scope: ChatContextScope.GENERAL_LEARNING,
			}
		}

		// Check if question is about current content
		if (
			context.currentContent &&
			(lowerMessage.includes('this') ||
				lowerMessage.includes('current') ||
				lowerMessage.includes('exercise') ||
				lowerMessage.includes('lesson'))
		) {
			return {
				isValid: true,
				scope: context.scope,
			}
		}

		// Default to valid for now - in production, implement more sophisticated validation
		return {
			isValid: true,
			scope: ChatContextScope.KAZAKH_LANGUAGE,
		}
	}

	// legacy buildSystemPrompt removed; prompt builder composes system content

	private calculateConfidence(response: OpenAI.Chat.Completions.ChatCompletion): number {
		// Simple confidence calculation based on response length and tokens
		const content = response.choices[0]?.message?.content || ''
		const tokens = response.usage?.completion_tokens || 0

		if (content.length < 10) return 0.3
		if (tokens < 10) return 0.4
		if (content.includes("I don't know") || content.includes("I'm not sure")) return 0.5

		return 0.8 // Default confidence
	}

	private extractSources(context: ChatContext): string[] {
		const sources: string[] = []

		if (context.currentContent?.moduleTitle) {
			sources.push(`Module: ${context.currentContent.moduleTitle}`)
		}

		if (context.currentContent?.segmentTitle) {
			sources.push(`Segment: ${context.currentContent.segmentTitle}`)
		}

		if (context.ragContext) {
			sources.push(...context.ragContext.map(item => item.source))
		}

		return sources
	}
}
