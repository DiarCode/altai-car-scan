import { Injectable } from '@nestjs/common'
import { ChatPromptConfigService } from './chat-prompt-config.service'
import { EXERCISE_TYPE } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { ChatContext } from '../../adapters/chat-llm-adapter.interface'
import { ChatSessionDocument } from '../../schemas/chat-session.schema'
import { MessageRole, ChatSessionType } from '../../types/chat-flow.types'
import { LearnerProgressService } from '../learner-progress.service'

// Minimal payload shape interfaces for canonical answer extraction
interface MultipleChoicePayloadShape {
	questions: { options: { answer: string; isCorrect?: boolean; correct?: boolean }[] }[]
}
interface ClozePayloadShape {
	sentences: { answers: string[] }[]
}
interface ListeningQuizPayloadShape {
	questions: { options: { correct?: boolean }[] }[]
}
interface SentenceReorderPayloadShape {
	fragments: string[]
}
interface PronunciationPayloadShape {
	text: string
}
interface DictationPayloadShape {
	transcript: string
}

interface InternalPromptContext {
	moduleBlock?: string
	segmentBlock?: string
	interestSegmentBlock?: string
	vocabBlock?: string
	exerciseBlock?: string
	performanceBlock?: string
	nextBlock?: string
	longTermSummaryBlock?: string
	profileBlock?: string
	historyMessages: { role: MessageRole; content: string }[]
	_debug?: { [k: string]: any }
}

// Core persona constant
const CORE_PERSONA = `You are an adaptive Kazakh language learning tutor. Follow rules: 
1. Stay focused on Kazakh language learning.
2. Provide concise, clear explanations with examples.
3. Never hallucinate module progress; rely only on provided blocks.
4. If correct answers block present, do NOT reveal answers unless user asks explicitly or giving feedback.
5. Encourage recall before giving solutions.`

@Injectable()
export class ChatPromptBuilderService {
	constructor(
		private readonly cfg: ChatPromptConfigService,
		private readonly prisma: PrismaService,
		private readonly progress: LearnerProgressService,
	) {}

	async buildInternalContext(
		session: ChatSessionDocument,
		chatContext: ChatContext,
		conversationHistory: { role: MessageRole; content: string; timestamp: Date }[],
		longTermSummary?: string,
	): Promise<InternalPromptContext> {
		const blocks: InternalPromptContext = {
			historyMessages: [],
		}

		blocks.profileBlock = this.buildProfileBlock(chatContext)
		// Always include module in learning flow, optional trimmed in free chat
		if (session.type === ChatSessionType.LEARNING_FLOW) {
			blocks.moduleBlock = this.buildModuleBlock(session)
		} else if (session.type === ChatSessionType.FREE_CHAT) {
			const full = this.buildModuleBlock(session)
			if (full) blocks.moduleBlock = full.split('\n').slice(0, 3).join('\n')
		}
		if (session.type === ChatSessionType.LEARNING_FLOW) {
			blocks.segmentBlock = await this.buildSegmentBlock(session, chatContext)
			blocks.interestSegmentBlock = this.buildInterestSegmentBlock(chatContext)
			blocks.vocabBlock = this.buildVocabBlock(chatContext)
			blocks.exerciseBlock = await this.buildExerciseBlock(session)
			blocks.performanceBlock = await this.buildPerformanceBlock(
				session.learningContext.moduleId,
				session.learnerId,
			)
			blocks.nextBlock = this.buildNextBlock(session)
		}
		blocks.longTermSummaryBlock = this.buildLongTermSummariesBlock(session, longTermSummary)
		// history window with token-based pruning
		const history = conversationHistory.slice(-this.cfg.historyWindow)
		blocks.historyMessages = this.pruneHistoryByTokens(history, this.cfg.historyMaxTokens)
		blocks._debug = {
			historyPrunedFrom: history.length,
			historyUsed: blocks.historyMessages.length,
		}
		return blocks
	}

	buildMessages(
		userMessage: string,
		blocks: InternalPromptContext,
	): { role: 'system' | 'user' | 'assistant'; content: string }[] {
		const systemParts: string[] = []
		systemParts.push(this.corePersona())
		if (blocks.profileBlock) systemParts.push(blocks.profileBlock)
		if (blocks.moduleBlock) systemParts.push(blocks.moduleBlock)
		if (blocks.segmentBlock) systemParts.push(blocks.segmentBlock)
		if (blocks.interestSegmentBlock) systemParts.push(blocks.interestSegmentBlock)
		if (blocks.vocabBlock) systemParts.push(blocks.vocabBlock)
		if (blocks.exerciseBlock) systemParts.push(blocks.exerciseBlock)
		if (blocks.performanceBlock) systemParts.push(blocks.performanceBlock)
		if (blocks.nextBlock) systemParts.push(blocks.nextBlock)
		if (blocks.longTermSummaryBlock) systemParts.push(blocks.longTermSummaryBlock)

		const msgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
			{ role: 'system', content: systemParts.join('\n\n').trim() },
		]
		blocks.historyMessages.forEach(h => {
			msgs.push({
				role: h.role === MessageRole.USER ? 'user' : 'assistant',
				content: h.content,
			})
		})
		msgs.push({ role: 'user', content: userMessage })
		return msgs
	}

	private corePersona(): string {
		return CORE_PERSONA
	}

	private buildProfileBlock(ctx: ChatContext): string {
		return `[[LEARNER]]\nID: ${ctx.learnerId}\nNative Language: ${ctx.learnerLanguage}\nInterests: ${ctx.learnerInterests.join(', ') || 'None'}\nScope: ${ctx.scope}`
	}

	private buildModuleBlock(session: ChatSessionDocument): string | undefined {
		const mod = session.learningContext.module
		if (!mod) return undefined
		return `[[MODULE]]\nTitle: ${mod.title}\nLevel: ${mod.level.code} ${mod.level.title}\nDescription: ${this.truncate(mod.description, 400)}\nOutcomes: ${this.truncate(mod.outcomes, 400)}`
	}

	private buildSegmentBlock(
		session: ChatSessionDocument,
		chatContext: ChatContext,
	): Promise<string | undefined> {
		if (!session.learningContext.currentSegmentId) return Promise.resolve(undefined)
		const segTitle = chatContext.currentContent?.segmentTitle || 'Unknown'
		const segContent = this.truncate(
			chatContext.currentContent?.segmentContent || '',
			this.cfg.segmentSummaryChars,
		)
		return Promise.resolve(
			`[[SEGMENT]]\nSegmentID: ${session.learningContext.currentSegmentId}\nTitle: ${segTitle}\nSummary: ${segContent}`,
		)
	}

	private async buildExerciseBlock(session: ChatSessionDocument): Promise<string | undefined> {
		const exId = session.learningContext.currentExerciseId
		if (!exId) return undefined
		const policy = this.cfg.includeCorrectAnswerPolicy
		let answerSnippet: string | undefined
		if (policy === 'always' || policy === 'after_submission') {
			let allow = true
			if (policy === 'after_submission') {
				const attempts = await this.progress.getExerciseAttempts(session.learnerId, [exId])
				allow = attempts.length > 0
			}
			if (allow) answerSnippet = await this.getCorrectAnswerSnippet(exId)
		}
		return this.composeExerciseBlock(exId, answerSnippet)
	}

	private async buildPerformanceBlock(
		moduleId: number,
		learnerId: number,
	): Promise<string | undefined> {
		try {
			// Get all exercise IDs for module
			const exercises = await this.prisma.exercise.findMany({
				where: { interestSegment: { segment: { moduleId } } },
				select: { id: true, title: true, type: true },
			})
			if (!exercises.length) return '[[PERFORMANCE]]\nNo exercises in module yet.'
			const exerciseIds = exercises.map(e => e.id)
			const attempts = await this.progress.getExerciseAttempts(learnerId, exerciseIds)
			if (!attempts.length) return '[[PERFORMANCE]]\nNo attempts yet.'
			// Latest attempt per exercise
			const latest = new Map<number, (typeof attempts)[number]>()
			for (const att of attempts) if (!latest.has(att.exerciseId)) latest.set(att.exerciseId, att)
			const passThreshold = this.cfg.passThreshold
			const mistakeEntries: { id: number; title?: string; type?: string; score: number }[] = []
			for (const ex of exercises) {
				const la = latest.get(ex.id)
				if (la && la.score < passThreshold) {
					mistakeEntries.push({
						id: ex.id,
						title: ex.title || `Exercise ${ex.id}`,
						type: ex.type,
						score: la.score,
					})
				}
			}
			if (!mistakeEntries.length)
				return `[[PERFORMANCE]]\nAll latest attempts at or above ${passThreshold}%. Great progress.`
			mistakeEntries.sort((a, b) => a.score - b.score)
			const limited = mistakeEntries.slice(0, this.cfg.mistakesLimit)
			const lines = limited.map(m => `• ${m.title} (id ${m.id}, type ${m.type}) score ${m.score}%`)
			if (mistakeEntries.length > limited.length)
				lines.push(`… ${mistakeEntries.length - limited.length} more below ${passThreshold}%.`)
			return `[[PERFORMANCE]]\nRecent weaknesses (latest attempt per exercise):\n${lines.join('\n')}`
		} catch (e) {
			return `[[PERFORMANCE]]\nUnable to compute performance: ${(e as Error).message}`
		}
	}

	private buildNextBlock(session: ChatSessionDocument): string | undefined {
		const lc = session.learningContext
		const hints: string[] = []
		if (!lc.currentSegmentId) hints.push('Action: NEXT_SEGMENT')
		else if (!lc.currentExerciseId) hints.push('Action: START_EXERCISE')
		else hints.push('Action: SUBMIT_ANSWER')
		if (
			lc.nextModuleId &&
			!lc.currentSegmentId &&
			lc.completedSegmentIds?.length === lc.segmentIds?.length
		) {
			hints.push(`Upcoming Module ID: ${lc.nextModuleId}`)
		}
		return `[[NEXT]]\n${hints.join('\n')}`
	}

	private composeExerciseBlock(exerciseId: number, answerSnippet?: string): string {
		const base = [
			'[[EXERCISE]]',
			`ExerciseID: ${exerciseId}`,
			`AnswerPolicy: ${this.cfg.includeCorrectAnswerPolicy}`,
		]
		if (answerSnippet) base.push(`CanonicalAnswer: ${answerSnippet}`)
		return base.join('\n')
	}

	private buildInterestSegmentBlock(chatContext: ChatContext): string | undefined {
		const content = chatContext.currentContent?.interestSegmentContent
		if (!content) return undefined
		return `[[INTEREST_SEGMENT]]\nSummary: ${this.truncate(content, this.cfg.interestSegmentSummaryChars)}`
	}

	private buildVocabBlock(chatContext: ChatContext): string | undefined {
		const vocab = chatContext.currentContent?.moduleVocabulary || []
		if (!vocab.length) return undefined
		const limited = vocab.slice(0, this.cfg.vocabLimit)
		const joined = limited.join(', ')
		return `[[VOCAB]]\nTerms: ${this.truncate(joined, this.cfg.vocabBlockMaxChars)}`
	}

	private buildLongTermSummariesBlock(
		session: ChatSessionDocument,
		longTermSummary?: string,
	): string | undefined {
		const summaries = session.conversationSummaries || []
		if (!summaries.length && !longTermSummary) return undefined
		const lines: string[] = []
		if (longTermSummary) lines.push(`(new) ${longTermSummary}`)
		for (const s of summaries.slice(-3)) {
			lines.push(`${s.summary}`)
		}
		return `[[LONG_TERM_MEMORY]]\n${lines.join('\n---\n')}`
	}

	private pruneHistoryByTokens(
		history: { role: MessageRole; content: string; timestamp: Date }[],
		maxTokens: number,
	): { role: MessageRole; content: string }[] {
		const result: { role: MessageRole; content: string }[] = []
		let tokens = 0
		for (let i = history.length - 1; i >= 0; i--) {
			const h = history[i]
			const est = this.estimateTokens(h.content)
			if (tokens + est > maxTokens) break
			result.unshift({ role: h.role, content: h.content })
			tokens += est
		}
		return result
	}

	private estimateTokens(text: string): number {
		return Math.ceil((text || '').length / 4)
	}

	private async loadExercise(exerciseId: number) {
		return this.prisma.exercise.findUnique({
			where: { id: exerciseId },
			select: { type: true, payload: true },
		})
	}

	private extractMultipleChoiceAnswer(payload: unknown): string | undefined {
		const p = payload as MultipleChoicePayloadShape
		if (!p?.questions?.length) return undefined
		return this.truncate(
			p.questions
				.map((q, qi) => {
					const idx = q.options?.findIndex(o => o.isCorrect || o.correct)
					if (idx == null || idx < 0) return `Q${qi + 1}:?`
					return `Q${qi + 1}:${q.options[idx].answer}`
				})
				.join(' | '),
			this.cfg.correctAnswerMaxChars,
		)
	}

	private extractClozeAnswer(payload: unknown): string | undefined {
		const p = payload as ClozePayloadShape
		if (!p?.sentences?.length) return undefined
		return this.truncate(
			p.sentences.map((s, i) => `B${i + 1}:${s.answers?.[0] || '?'}`).join(', '),
			this.cfg.correctAnswerMaxChars,
		)
	}

	private extractListeningQuizAnswer(payload: unknown): string | undefined {
		const p = payload as ListeningQuizPayloadShape
		if (!p?.questions?.length) return undefined
		return this.truncate(
			p.questions
				.map((q, qi) => {
					const idx = q.options?.findIndex(o => o.correct)
					return `Q${qi + 1}:${idx != null && idx >= 0 ? idx + 1 : '?'}`
				})
				.join(' '),
			this.cfg.correctAnswerMaxChars,
		)
	}

	private extractDictationAnswer(payload: unknown): string | undefined {
		const p = payload as DictationPayloadShape
		return p?.transcript ? this.truncate(p.transcript, this.cfg.correctAnswerMaxChars) : undefined
	}

	private extractSentenceReorderAnswer(payload: unknown): string | undefined {
		const p = payload as SentenceReorderPayloadShape
		return p?.fragments?.length
			? this.truncate(p.fragments.join(' | '), this.cfg.correctAnswerMaxChars)
			: undefined
	}

	private extractPronunciationAnswer(payload: unknown): string | undefined {
		const p = payload as PronunciationPayloadShape
		return p?.text ? this.truncate(p.text, this.cfg.correctAnswerMaxChars) : undefined
	}

	private async getCorrectAnswerSnippet(exerciseId: number): Promise<string | undefined> {
		try {
			const ex = await this.loadExercise(exerciseId)
			if (!ex) return undefined
			switch (ex.type) {
				case EXERCISE_TYPE.MULTIPLE_CHOICE:
					return this.extractMultipleChoiceAnswer(ex.payload)
				case EXERCISE_TYPE.CLOZE:
					return this.extractClozeAnswer(ex.payload)
				case EXERCISE_TYPE.LISTENING_QUIZ:
					return this.extractListeningQuizAnswer(ex.payload)
				case EXERCISE_TYPE.DICTATION:
					return this.extractDictationAnswer(ex.payload)
				case EXERCISE_TYPE.SENTENCE_REORDER:
					return this.extractSentenceReorderAnswer(ex.payload)
				case EXERCISE_TYPE.PRONUNCIATION:
					return this.extractPronunciationAnswer(ex.payload)
				case EXERCISE_TYPE.PICTURE_DESCRIPTION:
				case EXERCISE_TYPE.FLASHCARD:
				default:
					return undefined
			}
		} catch {
			return undefined
		}
	}

	private truncate(text: string, max: number): string {
		if (!text) return ''
		return text.length > max ? text.slice(0, max) + '…' : text
	}
}
