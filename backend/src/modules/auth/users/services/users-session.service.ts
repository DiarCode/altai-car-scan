// src/modules/auth/learner/services/learner-session.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { JwtService } from 'src/common/services/jwt.service'
import { AppConfigService } from 'src/common/config/config.service'
import { parseExpirationDate } from 'src/common/utils/expiration.util'

@Injectable()
export class UsersSessionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly config: AppConfigService,
	) {}

	private async linkSessionToLearner(learnerId: number, sessionId: number): Promise<void> {
		await this.prisma.users.update({
			where: { id: learnerId },
			data: { session: { connect: { id: sessionId } } },
		})
	}

	/** Issue or refresh a JWT session */
	async upsertSession(learnerId: number): Promise<string> {
		const now = new Date()
		const expiresAt = parseExpirationDate(this.config.userJwt.expiresIn, now)
		const existing = await this.prisma.usersSession.findUnique({
			where: { learnerId },
		})
		const token = this.jwtService.signLearner({ learnerId })

		if (existing) {
			const updated = await this.prisma.usersSession.update({
				where: { id: existing.id },
				data: { token, expiresAt },
			})
			await this.linkSessionToLearner(learnerId, updated.id)
			return updated.token
		}

		const created = await this.prisma.usersSession.create({
			data: { learnerId, token, expiresAt },
		})
		await this.linkSessionToLearner(learnerId, created.id)
		return created.token
	}

	/** Validate JWT + DB session */
	async validateLearnerSession(token: string): Promise<number> {
		let payload: { learnerId: number }
		try {
			payload = this.jwtService.verifyLearner(token)
		} catch {
			throw new UnauthorizedException('Invalid or expired token')
		}

		const session = await this.prisma.usersSession.findFirst({
			where: { token, expiresAt: { gt: new Date() } },
		})
		if (!session) throw new UnauthorizedException('Session revoked or expired')
		return payload.learnerId
	}

	/** Revoke the session */
	async revokeLearnerSession(token: string): Promise<void> {
		await this.prisma.usersSession.deleteMany({ where: { token } })
	}
}
