import { Injectable, Logger } from '@nestjs/common'
import fs from 'fs'
import path from 'path'
import {
	Prisma,
	NOTIFICATION_TYPE,
	DEVICE_PLATFORM,
	PUSH_PROVIDER,
	NOTIFICATION_CHANNEL,
	RECIPIENT_TYPE,
	NOTIFICATION_STATUS,
} from '@prisma/client'
import { ExpoPushMessage } from 'expo-server-sdk'
import { PrismaService } from 'src/prisma/prisma.service'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import {
	BaseNotificationDto,
	NotificationMessageBase,
	NotificationsFilter,
} from './dtos/notifications.dtos'
import { ExpoPushProvider } from './providers/expo-push.provider'

export type NotificationPayload = {
	title: string
	body: string
	data?: Record<string, any>
	deepLink?: string
	type: NOTIFICATION_TYPE
	persist?: boolean
	learnerId?: number // for localization
}

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name)
	// Cache locale templates in memory to avoid fs reads on every send
	private readonly localeCache = new Map<
		'kazakh' | 'russian' | 'english',
		Record<NOTIFICATION_TYPE, { title: string; body: string }>
	>()

	constructor(
		private readonly prisma: PrismaService,
		private readonly expoProvider: ExpoPushProvider,
	) {}

	async registerDevice(params: {
		learnerId?: number
		token: string
		platform: DEVICE_PLATFORM
		provider?: PUSH_PROVIDER
		locale?: string
		timezone?: string
	}): Promise<void> {
		const provider = params.provider ?? PUSH_PROVIDER.EXPO
		await this.prisma.deviceToken.upsert({
			where: { token: params.token },
			update: {
				learnerId: params.learnerId,
				platform: params.platform,
				provider,
				locale: params.locale,
				timezone: params.timezone,
				isActive: true,
				lastActiveAt: new Date(),
			},
			create: {
				learnerId: params.learnerId ?? null,
				token: params.token,
				platform: params.platform,
				provider,
				locale: params.locale,
				timezone: params.timezone,
				isActive: true,
				lastActiveAt: new Date(),
			},
		})
	}

	async sendToLearner(
		learnerId: number,
		payload: NotificationPayload,
	): Promise<{ id?: number; attempted: number; delivered: number }> {
		// --- Localization ---
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true },
		})

		let lang: 'english' | 'kazakh' | 'russian' = 'english'
		if (learner?.nativeLanguage === 'KAZAKH') lang = 'kazakh'
		else if (learner?.nativeLanguage === 'RUSSIAN') lang = 'russian'

		const templates = this.getLocaleTemplates(lang)
		const tpl: { title: string; body: string } = templates[payload.type] ?? {
			title: payload.title,
			body: payload.body,
		}
		// Replace placeholders in body
		let title = tpl.title || payload.title
		let body = tpl.body || payload.body
		if (payload.data) {
			Object.entries(payload.data).forEach(([k, v]) => {
				title = title.replace(`{${k}}`, String(v))
				body = body.replace(`{${k}}`, String(v))
			})
		}
		const shouldPersist = payload.persist !== false
		let recordId: number | undefined
		if (shouldPersist) {
			const rec = await this.prisma.notification.create({
				data: {
					recipientId: learnerId,
					recipientType: RECIPIENT_TYPE.LEARNER,
					type: payload.type,
					title,
					body,
					data: payload.data as Prisma.InputJsonValue | undefined,
					deepLink: payload.deepLink,
					channel: NOTIFICATION_CHANNEL.IN_APP,
					status: NOTIFICATION_STATUS.QUEUED,
				},
			})
			recordId = rec.id
		}

		// Resolve device tokens
		const devices = await this.prisma.deviceToken.findMany({
			where: { learnerId, isActive: true },
			select: { token: true, platform: true },
		})

		if (devices.length === 0) {
			this.logger.warn(`No active device tokens for learner ${learnerId}`)
			// In-app notification is already persisted and visible even without push
			if (recordId) {
				await this.prisma.notification.update({
					where: { id: recordId },
					data: { sentAt: new Date(), status: NOTIFICATION_STATUS.SENT },
				})
			}
			return { id: recordId, attempted: 0, delivered: 0 }
		}

		// Build Expo messages
		const messages: ExpoPushMessage[] = devices.map(d => ({
			to: d.token,
			sound: 'default',
			title,
			body,
			data: {
				...(payload.data ? payload.data : {}),
				deepLink: payload.deepLink,
				type: payload.type,
			},
		}))

		const tickets = await this.expoProvider.send(messages)
		const delivered = tickets.filter(t => t.status === 'ok').length
		if (recordId) {
			await this.prisma.notification.update({
				where: { id: recordId },
				data: {
					sentAt: new Date(),
					status: delivered > 0 ? NOTIFICATION_STATUS.SENT : NOTIFICATION_STATUS.FAILED,
				},
			})
		}
		return { id: recordId, attempted: devices.length, delivered }
	}

	async listForLearner(
		learnerId: number,
		filter: NotificationsFilter,
	): Promise<PaginatedResponse<BaseNotificationDto>> {
		const { page, pageSize, disablePagination, status, type, search, unreadOnly } = filter

		const where: Prisma.NotificationWhereInput = { recipientId: learnerId }
		if (status) where.status = status
		if (type) where.type = type
		if (unreadOnly) where.readAt = null
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ body: { contains: search, mode: 'insensitive' } },
			]
		}

		const pageData = await paginatePrisma(
			this.prisma.notification,
			{
				where,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					recipientId: true,
					type: true,
					title: true,
					body: true,
					data: true,
					deepLink: true,
					createdAt: true,
					sentAt: true,
					readAt: true,
					status: true,
				},
			},
			this.prisma.notification,
			{ where },
			{ page, pageSize, disablePagination },
		)

		return pageData as PaginatedResponse<BaseNotificationDto>
	}

	async markRead(learnerId: number, id: number): Promise<void> {
		await this.prisma.notification.updateMany({
			where: { id, recipientId: learnerId },
			data: { readAt: new Date(), status: NOTIFICATION_STATUS.READ },
		})
	}

	private getLocaleTemplates(
		lang: 'english' | 'kazakh' | 'russian',
	): Record<NOTIFICATION_TYPE, { title: string; body: string }> {
		const cached = this.localeCache.get(lang)
		if (cached) return cached
		const load = (l: 'english' | 'kazakh' | 'russian') => {
			const filename = `notifications.${l}.json`
			const candidates = [
				// Primary: alongside compiled JS (dist/modules/notifications/locales)
				path.join(__dirname, 'locales', filename),
				// Fallback: when builder places files under dist/src/... (some setups)
				path.join(process.cwd(), 'dist', 'src', 'modules', 'notifications', 'locales', filename),
				// Fallback: run directly from TS sources (e.g., when assets weren't copied yet)
				path.join(process.cwd(), 'src', 'modules', 'notifications', 'locales', filename),
			]
			for (const p of candidates) {
				if (fs.existsSync(p)) {
					const raw = fs.readFileSync(p, 'utf8')
					return JSON.parse(raw) as Record<NOTIFICATION_TYPE, { title: string; body: string }>
				}
			}
			throw new Error(`Notification locale file not found for ${l}`)
		}
		try {
			const t = load(lang)
			this.localeCache.set(lang, t)
			return t
		} catch {
			const t = load('english')
			this.localeCache.set('english', t)
			return t
		}
	}
}

export class NotificationTemplates {
	static dailyTaskCreated(): NotificationMessageBase {
		return {
			title: 'Your daily practice is ready',
			body: "Open today's tasks and start learning",
			deepLink: 'app://daily-task',
		}
	}

	static dailyTaskCompleted(): NotificationMessageBase {
		return {
			title: 'Great job! Daily task complete',
			body: 'Come back tomorrow to keep your streak',
			deepLink: 'app://daily-task',
		}
	}

	static dailyTaskIncomplete(): NotificationMessageBase {
		return {
			title: 'Finish your daily practice',
			body: 'A few tasks left for today—you got this',
			deepLink: 'app://daily-task',
		}
	}

	static vocabDue(count: number): NotificationMessageBase {
		return {
			title: 'Vocabulary review due',
			body: `You have ${count} words to review today`,
			deepLink: 'app://vocab/review',
		}
	}

	static onboardingWelcome(name?: string): NotificationMessageBase {
		return {
			title: `Welcome${name ? ', ' + name : ''}!`,
			body: 'Your learning path is ready',
			deepLink: 'app://modules',
		}
	}

	static levelAssigned(levelCode: string): NotificationMessageBase {
		return {
			title: `Assigned to ${levelCode}`,
			body: 'Jump into your modules and start learning',
			deepLink: `app://modules?level=${levelCode}`,
		}
	}

	static chatSessionCompleted(sessionId: string): NotificationMessageBase {
		return {
			title: 'Session complete',
			body: 'Summary is ready to review',
			deepLink: `app://chat/session/${sessionId}`,
		}
	}

	static chatInactivityNudge(sessionId?: string): NotificationMessageBase {
		return {
			title: 'Continue your practice',
			body: 'Pick up where you left off',
			deepLink: sessionId ? `app://chat/session/${sessionId}` : 'app://chat',
		}
	}

	static freeChatNudge(): NotificationMessageBase {
		return {
			title: 'Try a 5‑minute free chat',
			body: 'Practice Kazakh in a quick conversation',
			deepLink: 'app://free-chat',
		}
	}

	static weeklySummary(): NotificationMessageBase {
		// TODO: Generate actual weekly summary content and tips for the learner
		return {
			title: 'Your weekly progress',
			body: 'Summary and tips are ready',
			deepLink: 'app://notifications/weekly-summary',
		}
	}
}

export interface SendArgsBase {
	persist?: boolean
	data?: Record<string, any>
}

@Injectable()
export class NotificationsApi {
	constructor(private readonly svc: NotificationsService) {}

	async dailyTaskCreated(learnerId: number, data?: Record<string, any>) {
		const base = NotificationTemplates.dailyTaskCreated()
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.DAILY_TASK_CREATED,
			data,
			persist: true,
		})
	}

	async dailyTaskCompleted(learnerId: number, data?: Record<string, any>) {
		const base = NotificationTemplates.dailyTaskCompleted()
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.DAILY_TASK_COMPLETED,
			data,
			persist: true,
		})
	}

	async dailyTaskIncomplete(learnerId: number, data?: Record<string, any>) {
		const base = NotificationTemplates.dailyTaskIncomplete()
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.DAILY_TASK_INCOMPLETE,
			data,
			persist: false,
		})
	}

	async vocabReviewDue(learnerId: number, count: number) {
		const base = NotificationTemplates.vocabDue(count)
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.VOCAB_REVIEW_DUE,
			data: { count },
			persist: true,
		})
	}

	async onboardingWelcome(learnerId: number, name?: string) {
		const base = NotificationTemplates.onboardingWelcome(name)
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.ONBOARDING_WELCOME,
			persist: true,
		})
	}

	async levelAssigned(learnerId: number, levelCode: string) {
		const base = NotificationTemplates.levelAssigned(levelCode)
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.LEVEL_ASSIGNED,
			data: { levelCode },
			persist: true,
		})
	}

	async chatSessionCompleted(learnerId: number, sessionId: string) {
		const base = NotificationTemplates.chatSessionCompleted(sessionId)
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.CHAT_SESSION_COMPLETED,
			data: { sessionId },
			persist: true,
		})
	}

	async chatInactivityNudge(learnerId: number, sessionId?: string) {
		const base = NotificationTemplates.chatInactivityNudge(sessionId)
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.CHAT_INACTIVITY_NUDGE,
			data: { sessionId },
			persist: false,
		})
	}

	async freeChatNudge(learnerId: number) {
		const base = NotificationTemplates.freeChatNudge()
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.FREE_CHAT_NUDGE,
			persist: false,
		})
	}

	async weeklySummary(
		learnerId: number,
		data?: {
			wordsLearnt?: number
			exercises?: { completed: number; failed: number }
			progress?: { dailyTasksCompleted: number; days: number }
			summary?: string
			[key: string]: unknown
		},
	) {
		// TODO: Compute weekly summary for learner and pass as data
		// Example: data = await this.svc.generateWeeklySummary(learnerId)
		const base = NotificationTemplates.weeklySummary()
		return this.svc.sendToLearner(learnerId, {
			...base,
			type: NOTIFICATION_TYPE.WEEKLY_SUMMARY,
			data,
			persist: true,
		})
	}
}
