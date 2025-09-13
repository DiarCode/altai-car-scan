// src/modules/chat/services/chat-summarization.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ChatSessionService } from './chat-session.service'
import { ChatMessageService } from './chat-message.service'
import { Inject } from '@nestjs/common'
import { ChatLLMAdapter, ChatContext } from '../adapters/chat-llm-adapter.interface'
import { ChatContextScope } from '../types/chat-flow.types'
import { ChatSessionDocument } from '../schemas/chat-session.schema'
import { ChatContextService } from './chat-context.service'
import { ChatPromptConfigService } from './chat-prompt-builder/chat-prompt-config.service'

@Injectable()
export class ChatSummarizationService {
	private readonly logger = new Logger(ChatSummarizationService.name)
	constructor(
		private readonly sessionService: ChatSessionService,
		private readonly messageService: ChatMessageService,
		private readonly contextService: ChatContextService,
		private readonly cfg: ChatPromptConfigService,
		@Inject('ChatLLMAdapter') private readonly llm: ChatLLMAdapter,
	) {}

	async ensureSummary(session: ChatSessionDocument): Promise<ChatSessionDocument> {
		if (!this.cfg.asyncSummarization) return session
		// Count messages
		const count = await this.messageService.getConversationHistory(
			session.sessionId,
			session.learnerId,
			this.cfg.summaryTriggerMessages + 5, // over-fetch a bit
		)
		if (count.length < this.cfg.summaryTriggerMessages) return session

		// Take oldest half as window to summarize (exclude already summarized by timestamps)
		const window = count.slice(0, Math.floor(count.length / 2))
		const from = window[0]?.timestamp
		const to = window[window.length - 1]?.timestamp
		if (!from || !to) return session

		// Avoid duplicate summary if overlapping range already summarized
		if (
			session.conversationSummaries?.some(
				s => s.fromMessageCreatedAt <= from && s.toMessageCreatedAt >= to,
			)
		) {
			return session
		}

		try {
			const text = window.map(m => `${m.role}: ${m.content}`).join('\n')
			// Use segment vs module scope (avoid numeric enum indexes)
			const scope = session.learningContext.currentSegmentId
				? ChatContextScope.CURRENT_SEGMENT
				: ChatContextScope.CURRENT_MODULE
			const ctx: ChatContext = await this.contextService.buildChatContext(session, scope, false)
			const prompt = `Summarize earlier conversation context (for language tutoring) focusing on learner challenges, mistakes, and progress. Max ${this.cfg.summaryMaxChars} chars.\n\n${text}`
			const res = await this.llm.generateResponse(prompt, ctx)
			const summary = res.content.slice(0, this.cfg.summaryMaxChars)
			session = await this.sessionService.appendConversationSummary(session.sessionId, {
				summary,
				fromMessageCreatedAt: from,
				toMessageCreatedAt: to,
			})
		} catch (e) {
			this.logger.warn(`Summarization failed: ${e instanceof Error ? e.message : e}`)
		}
		return session
	}
}
