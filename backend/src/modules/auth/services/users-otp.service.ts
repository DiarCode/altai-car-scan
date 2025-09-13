// src/modules/auth/user/services/user-otp.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { addMinutes } from 'date-fns'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { hashOtp, compareOtp } from 'src/common/utils/otp.util'
import { randomUUID } from 'crypto'

@Injectable()
export class UsersOtpService {
	private readonly logger = new Logger(UsersOtpService.name)
	private readonly TTL_MINUTES = 2

	constructor(
		private readonly prisma: PrismaService,
		private readonly whatsapp: WhatsAppAdapter,
	) {}

	/**
	 * Upsert user by phone (with placeholder name + empty interests),
	 * then generate & send OTP. Returns userId.
	 */
	async generateUserOtp(phone: string): Promise<number> {
		const placeholderName = `user-${randomUUID()}`

		const user = await this.prisma.user.upsert({
			where: { phoneNumber: phone },
			create: {
				name: placeholderName,
				phoneNumber: phone,
			},
			update: {
				name: placeholderName,
				phoneNumber: phone,
			},
		})

		// const code = generateOtp()
		const code = '1111'
		const expires = addMinutes(new Date(), this.TTL_MINUTES)
		const hashed = await hashOtp(code)

		const otpRecord = await this.prisma.usersOTPRequest.upsert({
			where: { userId: user.id },
			create: {
				userId: user.id,
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

		await this.prisma.user.update({
			where: { id: user.id },
			data: { otpRequest: { connect: { id: otpRecord.id } } },
		})

		// await this.whatsapp.sendOtp(phone, code)
		return user.id
	}

	/**
	 * Validate the OTP
	 */
	async validateUserOtp(userId: number, code: string): Promise<void> {
		const record = await this.prisma.usersOTPRequest.findFirst({
			where: { userId, expiresAt: { gt: new Date() } },
			orderBy: { createdAt: 'desc' },
		})
		if (!record || !(await compareOtp(code, record.otpCode))) {
			throw new BadRequestException('Invalid or expired OTP')
		}
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async cleanupExpiredOtps() {
		const result = await this.prisma.usersOTPRequest.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		})
		this.logger.debug(`Purged ${result.count} expired user OTP(s)`)
	}
}
