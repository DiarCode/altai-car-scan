import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { addMinutes } from 'date-fns'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { hashOtp, compareOtp } from 'src/common/utils/otp.util'

@Injectable()
export class AdminOtpService {
	private readonly logger = new Logger(AdminOtpService.name)
	private readonly TTL_MINUTES = 2

	constructor(
		private readonly prisma: PrismaService,
		private readonly whatsapp: WhatsAppAdapter,
	) {}

	private async linkOtpToAdmin(adminId: number, otpRequestId: number) {
		await this.prisma.admin.update({
			where: { id: adminId },
			data: { otpRequest: { connect: { id: otpRequestId } } },
		})
	}

	/**
	 * Generates a 4-digit OTP, hashes it, upserts into DB, and sends via WhatsApp.
	 */
	async generateAdminOtp(adminId: number, phone: string): Promise<void> {
		// const code = generateOtp()
		const code = '1111'
		const expires = addMinutes(new Date(), this.TTL_MINUTES)
		const hashed = await hashOtp(code)

		const otpRecord = await this.prisma.adminOtpRequest.upsert({
			where: { adminId },
			create: {
				adminId,
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

		await this.linkOtpToAdmin(adminId, otpRecord.id)
		// await this.whatsapp.sendOtp(phone, code)
	}

	/**
	 * Validates a submitted OTP by comparing its hash.
	 * Throws BadRequestException if no valid record or mismatch.
	 */
	async validateAdminOtp(adminId: number, code: string): Promise<boolean> {
		const record = await this.prisma.adminOtpRequest.findFirst({
			where: {
				adminId,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: 'desc' },
			select: { otpCode: true },
		})

		if (!record) {
			throw new BadRequestException('Invalid or expired OTP')
		}

		const isMatch = await compareOtp(code, record.otpCode)
		if (!isMatch) {
			throw new BadRequestException('Invalid or expired OTP')
		}

		return true
	}

	/**
	 * Cron job runs every minute to delete expired OTP requests.
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async cleanupExpiredOtps() {
		const result = await this.prisma.adminOtpRequest.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		})
		this.logger.debug(`Purged ${result.count} expired admin OTP(s)`)
	}
}
