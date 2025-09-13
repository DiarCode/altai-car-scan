import { Injectable, UnauthorizedException } from '@nestjs/common'
import { sign, verify, JwtPayload, SignOptions } from 'jsonwebtoken'
import { AppConfigService } from '../config/config.service'

export interface AdminJwtPayload extends JwtPayload {
	adminId: number
}

export interface LearnerJwtPayload extends JwtPayload {
	learnerId: number
}

@Injectable()
export class JwtService {
	constructor(private readonly config: AppConfigService) {}

	signAdmin(payload: AdminJwtPayload, overrideExp?: string): string {
		const secret = this.config.adminJwt.secret
		if (!secret) {
			throw new UnauthorizedException('Admin JWT secret is not configured')
		}

		const rawExpires: string = overrideExp ?? this.config.adminJwt.expiresIn
		const expiresIn = rawExpires as SignOptions['expiresIn']

		const options: SignOptions = { expiresIn }
		return sign(payload, secret, options)
	}

	verifyAdmin(token: string): AdminJwtPayload {
		const secret = this.config.adminJwt.secret
		if (!secret) {
			throw new UnauthorizedException('Admin JWT secret is not configured')
		}

		try {
			const raw = verify(token, secret)

			if (typeof raw === 'string') {
				throw new UnauthorizedException('Invalid admin token payload')
			}
			if (typeof raw === 'object' && raw !== null && typeof raw.adminId === 'number') {
				return { adminId: raw.adminId }
			}
			throw new UnauthorizedException('Invalid admin token payload')
		} catch {
			throw new UnauthorizedException('Invalid or expired admin token')
		}
	}

	signLearner(payload: LearnerJwtPayload, overrideExp?: string): string {
		const secret = this.config.learnerJwt.secret
		if (!secret) {
			throw new UnauthorizedException('Learner JWT secret is not configured')
		}

		const rawExpires: string = overrideExp ?? this.config.learnerJwt.expiresIn
		const expiresIn = rawExpires as SignOptions['expiresIn']
		const options: SignOptions = { expiresIn }

		return sign(payload, secret, options)
	}

	verifyLearner(token: string): LearnerJwtPayload {
		const secret = this.config.learnerJwt.secret
		if (!secret) {
			throw new UnauthorizedException('Learner JWT secret is not configured')
		}

		try {
			const raw = verify(token, secret)
			if (typeof raw === 'string') {
				throw new UnauthorizedException('Invalid learner token payload')
			}
			if (typeof raw === 'object' && raw !== null && typeof raw.learnerId === 'number') {
				return { learnerId: raw.learnerId }
			}
			throw new UnauthorizedException('Invalid learner token payload')
		} catch {
			throw new UnauthorizedException('Invalid or expired learner token')
		}
	}
}
