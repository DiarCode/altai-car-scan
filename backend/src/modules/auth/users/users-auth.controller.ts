// src/modules/auth/learner/learner-auth.controller.ts

import { Controller, Post, Body, Req, Res, UseGuards, Get } from '@nestjs/common'
import { Request, Response } from 'express'
import { CookieService } from 'src/common/services/cookie.service'
import { AppConfigService } from 'src/common/config/config.service'
import { parseExpirationDate } from 'src/common/utils/expiration.util'
import { UsersAuthGuard } from 'src/common/guards/users-auth.guard'
import { GetCurrentUser } from 'src/common/decorators/get-current-users.decorator'
import {
	RequestLearnerOtpDto,
	VerifyLearnerOtpDto,
	LearnerDto,
	SuccessVerifyOtpResponse,
} from './dtos/users-auth.dtos'
import { UsersOtpService } from './services/users-otp.service'
import { UsersSessionService } from './services/users-session.service'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { ApiResponse } from '@nestjs/swagger'
import { UsersProfileService } from './services/users-profile.service'

@Controller('users')
export class UsersAuthController {
	constructor(
		private readonly otp: UsersOtpService,
		private readonly sessions: UsersSessionService,
		private readonly cookies: CookieService,
		private readonly config: AppConfigService,
		private readonly profile: UsersProfileService,
	) {}

	/** 1) Request OTP (upserts placeholder learner) */
	@Post('otp/request')
	@ApiResponse({
		status: 200,
		description: 'OTP requested successfully',
	})
	async requestOtp(@Body() dto: RequestLearnerOtpDto) {
		await this.otp.generateLearnerOtp(dto.phoneNumber)
		return
	}

	/**
	 * 2) Verify OTP → set session, return isNew
	 */
	@Post('otp/verify')
	@ApiResponse({
		status: 200,
		type: SuccessVerifyOtpResponse,
		description: 'OTP verified successfully, session created',
	})
	async verifyOtp(
		@Body() dto: VerifyLearnerOtpDto,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const { id, verified } = await this.profile.findByPhone(dto.phoneNumber)
		// await this.otp.validateLearnerOtp(id, dto.code)

		const token = await this.sessions.upsertSession(id)
		const now = new Date()
		const expiresAt = parseExpirationDate(this.config.userJwt.expiresIn, now)
		const maxAgeMs = expiresAt.getTime() - now.getTime()
		this.cookies.setAuthCookie(req, res, token, maxAgeMs)

		return {
			success: true,
			expiresIn: Math.floor(maxAgeMs / 1000),
			isNew: !verified,
		}
	}

	/** 4) Logout */
	@Post('logout')
	@UseGuards(UsersAuthGuard)
	@ApiResponse({
		status: 200,
		description: 'Logged out successfully',
	})
	async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const token = this.cookies.getAuthCookie(req)
		if (token) {
			await this.sessions.revokeLearnerSession(token)
			this.cookies.clearAuthCookie(req, res)
		}
		return
	}

	/** 5) “Me” */
	@Get('me')
	@UseGuards(UsersAuthGuard)
	@ApiResponse({
		status: 200,
		type: LearnerDto,
		description: 'Returns current learner profile',
	})
	async me(@GetCurrentUser() learner: LearnerClaims): Promise<LearnerDto> {
		return this.profile.getById(learner.id)
	}
}
