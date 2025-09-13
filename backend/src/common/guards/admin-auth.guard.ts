import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AdminRequest } from '../types/admin-request.interface'
import { AdminSessionService } from 'src/modules/auth/admin/services/admin-session.service'
import { CookieService } from '../services/cookie.service'

@Injectable()
export class AdminAuthGuard implements CanActivate {
	constructor(
		private readonly sessions: AdminSessionService,
		private readonly cookieService: CookieService,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<AdminRequest>()
		const token = this.cookieService.getAuthCookie(req)
		if (!token) throw new UnauthorizedException('Authentication token missing')

		const adminId = await this.sessions.validateAdminSession(token)
		req.admin = { id: adminId }
		return true
	}
}
