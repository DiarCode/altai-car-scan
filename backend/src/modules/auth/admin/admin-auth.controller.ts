import {
	Controller,
	Post,
	Body,
	UnauthorizedException,
	Req,
	Res,
	UseGuards,
	Get,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { CookieService } from 'src/common/services/cookie.service'
import { GetCurrentAdmin } from 'src/common/decorators/get-current-admin.decorator'
import { AdminOtpService } from './services/admin-otp.service'
import { AdminProfileService } from './services/admin-profile.service'
import { AdminSessionService } from './services/admin-session.service'
import { parseExpirationDate } from 'src/common/utils/expiration.util'
import { AppConfigService } from 'src/common/config/config.service'
import { RequestAdminOtpDto, VerifyAdminOtpDto } from './dtos/admin-auth.dtos'

@Controller('admin')
export class AdminAuthController {
	constructor(
		private readonly otp: AdminOtpService,
		private readonly sessions: AdminSessionService,
		private readonly cookies: CookieService,
		private readonly profile: AdminProfileService,
		private readonly config: AppConfigService,
	) {}

	@Post('otp/request')
	async request(@Body() dto: RequestAdminOtpDto) {
		const admin = await this.profile.getByPhoneOrUnauthorized(dto.phoneNumber)
		if (!admin) throw new UnauthorizedException('No such admin')
		await this.otp.generateAdminOtp(admin.id, dto.phoneNumber)
		return { success: true }
	}

	@Post('otp/verify')
	async verify(
		@Body() dto: VerifyAdminOtpDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const admin = await this.profile.getByPhoneOrUnauthorized(dto.phoneNumber)
		await this.otp.validateAdminOtp(admin.id, dto.otpCode)

		const token = await this.sessions.upsertSession(admin.id)

		const now = new Date()
		const expStr = this.config.adminJwt.expiresIn
		const expiresAt = parseExpirationDate(expStr, now)
		const maxAgeMs = expiresAt.getTime() - now.getTime()

		this.cookies.setAuthCookie(req, res, token, maxAgeMs)

		return {
			success: true,
			expiresIn: Math.floor(maxAgeMs / 1000),
		}
	}

	@Post('logout')
	@UseGuards(AdminAuthGuard)
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const token = this.cookies.getAuthCookie(req)
		if (token) {
			await this.sessions.revokeAdminSession(token)
			this.cookies.clearAuthCookie(req, res)
		}
		return { success: true }
	}

	@Get('me')
	@UseGuards(AdminAuthGuard)
	async getCurrentAdmin(@GetCurrentAdmin() adminId: number) {
		return this.profile.getById(adminId)
	}
}
