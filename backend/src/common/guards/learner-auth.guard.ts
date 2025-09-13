import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { LearnerSessionService } from 'src/modules/auth/learner/services/learner-session.service'
import { CookieService } from '../services/cookie.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { LearnerRequest } from '../types/learner-request.interface'

@Injectable()
export class LearnerAuthGuard implements CanActivate {
	constructor(
		private readonly sessions: LearnerSessionService,
		private readonly cookieService: CookieService,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<LearnerRequest>()
		const token = this.cookieService.getAuthCookie(req)
		if (!token) throw new UnauthorizedException('Authentication token missing')

		const learnerId = await this.sessions.validateLearnerSession(token)

		// Fetch learner's native language
		const learner = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			select: { nativeLanguage: true },
		})

		if (!learner) {
			throw new UnauthorizedException('Learner not found')
		}

		req.learner = {
			id: learnerId,
			nativeLanguage: learner.nativeLanguage,
		}

		return true
	}
}
