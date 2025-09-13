// src/modules/chat/adapters/openai-chat.adapter.ts

import { Injectable, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'
import { AppConfigService } from 'src/common/config/config.service'
import { ChatContext, ChatResponse } from 'src/modules/chat/adapters/chat-llm-adapter.interface'
import { ChatContextScope, MessageRole } from 'src/modules/chat/types/chat-flow.types'
import { FreeChatLLMAdapter } from './free-chat-llm.adapter.interface'

@Injectable()
export class OpenAIFreeChatAdapter implements FreeChatLLMAdapter {
	private readonly logger = new Logger(OpenAIFreeChatAdapter.name)
	private readonly client: OpenAI
	private readonly model: string

	constructor(private readonly config: AppConfigService) {
		this.client = new OpenAI({ apiKey: config.openai.apiKey })
		this.model = config.openai.model
	}

	async generateResponse(userMessage: string, context: ChatContext): Promise<ChatResponse> {
		const startTime = Date.now()

		try {
			const messages = this.buildMessages(userMessage, context)

			const response = await this.client.chat.completions.create({
				model: this.model,
				messages,
				max_tokens: 1024,
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

	private buildMessages(
		userMessage: string,
		context: ChatContext,
	): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

		// System message with context
		messages.push({
			role: MessageRole.SYSTEM,
			content: this.buildSystemPrompt(context),
		})

		// Add RAG context if available
		if (context.ragContext && context.ragContext.length > 0) {
			const ragContent = context.ragContext
				.map(item => `Source: ${item.source}\nContent: ${item.content}`)
				.join('\n\n')

			messages.push({
				role: MessageRole.SYSTEM,
				content: `Here's relevant information from the knowledge base:\n\n${ragContent}`,
			})
		}

		// Add previous messages (last 5 for context)
		const recentMessages = context.previousMessages.slice(-5)
		recentMessages.forEach(msg => {
			messages.push({
				role: msg.role,
				content: msg.content,
			})
		})

		// Add current user message
		messages.push({
			role: MessageRole.USER,
			content: userMessage,
		})

		return messages
	}

	private buildSystemPrompt(context: ChatContext): string {
		let prompt = `You are a helpful Kazakh language learning assistant. You help students learn Kazakh language effectively.

Current Context:
- Language: ${context.learnerLanguage}
- Interests: ${context.learnerInterests.join(', ')}
- Scope: ${context.scope}

`

		if (context.currentContent?.segmentTitle) {
			prompt += `- Current Segment: ${context.currentContent.segmentTitle}\n`
		}

		if (context.currentContent?.segmentContent) {
			prompt += `- Segment Content: ${context.currentContent.segmentContent}\n`
		}

		if (context.currentContent?.exerciseTitle) {
			prompt += `- Current Exercise: ${context.currentContent.exerciseTitle}\n`
		}

		prompt += `
Guidelines:
1. Only answer questions related to Kazakh language learning
2. Be encouraging and supportive
3. Provide clear explanations with examples
4. Use the student's native language (${context.learnerLanguage}) when helpful
5. Reference the current content when relevant
6. Keep responses concise but informative
7. If asked about grammar, provide rules and examples
8. If asked about vocabulary, provide definitions and usage examples

Remember: You are here to help the student learn Kazakh language effectively within the context of their current lesson.`

		return prompt
	}

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
