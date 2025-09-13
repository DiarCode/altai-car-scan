import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { JwtService } from 'src/common/services/jwt.service'
import { AppConfigService } from 'src/common/config/config.service'
import { parseExpirationDate } from 'src/common/utils/expiration.util'

@Injectable()
export class AdminSessionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly config: AppConfigService,
	) {}

	private async linkSessionToAdmin(adminId: number, sessionId: number) {
		await this.prisma.admin.update({
			where: { id: adminId },
			data: { session: { connect: { id: sessionId } } },
		})
	}

	/**
	 * Creates or updates the admin’s session so that a fresh token is stored
	 * each time they log in. Always generates a new JWT and updates the DB record.
	 */
	async upsertSession(adminId: number): Promise<string> {
		const now = new Date()
		const expiresIn = this.config.adminJwt.expiresIn
		const expiresAt = parseExpirationDate(expiresIn, now)

		// Check for existing session record (even if still valid)
		const existing = await this.prisma.adminSession.findUnique({
			where: { adminId },
		})

		// Always generate a brand-new token
		const token = this.jwtService.signAdmin({ adminId })

		if (existing) {
			const updated = await this.prisma.adminSession.update({
				where: { id: existing.id },
				data: { token, expiresAt },
			})
			await this.linkSessionToAdmin(adminId, updated.id)
			return updated.token
		}

		const created = await this.prisma.adminSession.create({
			data: { adminId, token, expiresAt },
		})
		await this.linkSessionToAdmin(adminId, created.id)
		return created.token
	}

	/**
	 * Verifies the JWT and ensures there is a matching, non‐expired session in the DB.
	 * Returns the adminId if valid, otherwise throws UnauthorizedException.
	 */
	async validateAdminSession(token: string): Promise<number> {
		let payload: { adminId: number }
		try {
			payload = this.jwtService.verifyAdmin(token)
		} catch {
			throw new UnauthorizedException('Invalid or expired token')
		}

		const session = await this.prisma.adminSession.findFirst({
			where: {
				token,
				expiresAt: { gt: new Date() },
			},
		})

		if (!session) {
			throw new UnauthorizedException('Session revoked or expired')
		}

		return payload.adminId
	}

	/**
	 * Deletes any session record associated with the given token.
	 */
	async revokeAdminSession(token: string): Promise<void> {
		await this.prisma.adminSession.deleteMany({
			where: { token },
		})
	}
}
