// src/modules/auth/learner/services/learner-otp.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { addMinutes } from 'date-fns'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { hashOtp, compareOtp } from 'src/common/utils/otp.util'
import { randomUUID } from 'crypto'
import { LEVEL_CODE, NATIVE_LANGUAGE } from '@prisma/client'

@Injectable()
export class LearnerOtpService {
	private readonly logger = new Logger(LearnerOtpService.name)
	private readonly TTL_MINUTES = 2

	constructor(
		private readonly prisma: PrismaService,
		private readonly whatsapp: WhatsAppAdapter,
	) {}

	/**
	 * Upsert learner by phone (with placeholder name + empty interests),
	 * then generate & send OTP. Returns learnerId.
	 */
	async generateLearnerOtp(phone: string): Promise<number> {
		const placeholderName = `user-${randomUUID()}`

		const learner = await this.prisma.learner.upsert({
			where: { phoneNumber: phone },
			create: {
				name: placeholderName,
				phoneNumber: phone,
				nativeLanguage: NATIVE_LANGUAGE.KAZAKH, // or pick a default
				interests: [],
				dailyTimeGoal: 15, // default to no goal
				verified: false,
				assignedLevel: { connect: { code: LEVEL_CODE.A1 } }, // default to A1 level
			},
			update: {
				// keep existing name & interests
			},
		})

		// const code = generateOtp()
		const code = '1111'
		const expires = addMinutes(new Date(), this.TTL_MINUTES)
		const hashed = await hashOtp(code)

		const otpRecord = await this.prisma.learnerOtpRequest.upsert({
			where: { learnerId: learner.id },
			create: {
				learnerId: learner.id,
				phoneNumber: phone,
				otpCode: hashed,
				expiresAt: expires,
			},
			update: {
				otpCode: hashed,
				expiresAt: expires,
				createdAt: new Date(),
			},
		})

		await this.prisma.learner.update({
			where: { id: learner.id },
			data: { otpRequest: { connect: { id: otpRecord.id } } },
		})

		// await this.whatsapp.sendOtp(phone, code)
		return learner.id
	}

	/**
	 * Validate the OTP
	 */
	async validateLearnerOtp(learnerId: number, code: string): Promise<void> {
		const record = await this.prisma.learnerOtpRequest.findFirst({
			where: { learnerId, expiresAt: { gt: new Date() } },
			orderBy: { createdAt: 'desc' },
		})
		if (!record || !(await compareOtp(code, record.otpCode))) {
			throw new BadRequestException('Invalid or expired OTP')
		}
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async cleanupExpiredOtps() {
		const result = await this.prisma.learnerOtpRequest.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		})
		this.logger.debug(`Purged ${result.count} expired learner OTP(s)`)
	}
}
