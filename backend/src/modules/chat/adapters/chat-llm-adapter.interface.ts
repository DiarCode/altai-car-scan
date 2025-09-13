// src/modules/chat/adapters/chat-llm-adapter.interface.ts

import { NATIVE_LANGUAGE } from '@prisma/client'
import { ChatContextScope, MessageRole } from '../types/chat-flow.types'
import { ChatSessionDocument } from '../schemas/chat-session.schema'

export interface ChatContext {
	learnerId: number
	moduleId: number
	segmentId?: number
	exerciseId?: number
	learnerLanguage: NATIVE_LANGUAGE
	learnerInterests: string[]
	scope: ChatContextScope
	previousMessages: Array<{
		role: MessageRole
		content: string
		timestamp: Date
	}>
	currentContent?: {
		moduleTitle?: string
		segmentTitle?: string
		segmentContent?: string
		exerciseTitle?: string
		exerciseContent?: any
		interestSegmentContent?: string
		moduleVocabulary?: string[]
	}
	ragContext?: { content: string; source: string; relevance: number }[]
	/** Internal session document for prompt builder (not exposed externally) */
	_internalSession?: ChatSessionDocument
}

export interface ChatResponse {
	content: string
	metadata: {
		model: string
		tokensUsed: number
		responseTime: number
		confidence?: number
		sources?: string[]
		contextScope: ChatContextScope
	}
}

export interface ChatLLMAdapter {
	/**
	 * Generate a response to user's question
	 */
	generateResponse(userMessage: string, context: ChatContext): Promise<ChatResponse>

	/**
	 * Generate explanation for specific content
	 */
	generateExplanation(content: string, context: ChatContext): Promise<ChatResponse>

	/**
	 * Generate memorization tips
	 */
	generateMemorizationTips(content: string, context: ChatContext): Promise<ChatResponse>

	/**
	 * Generate and parse a JSON schema for a vocabulary word (word, translation, description, example)
	 * Returns a parsed object, not a string.
	 */
	extractVocabularyJson(
		word: string,
		context: ChatContext,
	): Promise<{
		word: string
		translation: string
		description: string
		example?: string
	}>

	/**
	 * Generate help response
	 */
	generateHelpResponse(context: ChatContext): Promise<ChatResponse>

	/**
	 * Validate if the question is within allowed scope
	 */
	validateQuestionScope(
		userMessage: string,
		context: ChatContext,
	): Promise<{
		isValid: boolean
		scope: ChatContextScope
		reason?: string
	}>
}
