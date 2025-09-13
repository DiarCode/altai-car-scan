// src/modules/auth/learner/learner-auth.controller.ts

import { Controller, Post, Body, Req, Res, UseGuards, Get } from '@nestjs/common'
import { Request, Response } from 'express'
import { CookieService } from 'src/common/services/cookie.service'
import { AppConfigService } from 'src/common/config/config.service'
import { parseExpirationDate } from 'src/common/utils/expiration.util'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import {
	RequestLearnerOtpDto,
	VerifyLearnerOtpDto,
	CompleteProfileDto,
	LearnerDto,
	SuccessVerifyOtpResponse,
} from './dtos/learner-auth.dtos'
import { LearnerOtpService } from './services/learner-otp.service'
import { LearnerSessionService } from './services/learner-session.service'
import { LearnerProfileService } from './services/learner-profile.service'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { ApiResponse } from '@nestjs/swagger'
import { NotificationsService } from 'src/modules/notifications/notifications.service'

@Controller('learner')
export class LearnerAuthController {
	constructor(
		private readonly otp: LearnerOtpService,
		private readonly sessions: LearnerSessionService,
		private readonly cookies: CookieService,
		private readonly config: AppConfigService,
		private readonly profile: LearnerProfileService,
		private readonly notifications: NotificationsService,
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
		const expiresAt = parseExpirationDate(this.config.learnerJwt.expiresIn, now)
		const maxAgeMs = expiresAt.getTime() - now.getTime()
		this.cookies.setAuthCookie(req, res, token, maxAgeMs)

		// Optionally register device during authorization
		if (dto.deviceToken && dto.devicePlatform) {
			await this.notifications.registerDevice({
				learnerId: id,
				token: dto.deviceToken,
				platform: dto.devicePlatform,
				provider: dto.pushProvider,
				locale: dto.deviceLocale,
				timezone: dto.deviceTimezone,
			})
		}

		return {
			success: true,
			expiresIn: Math.floor(maxAgeMs / 1000),
			isNew: !verified,
		}
	}

	/** 3) Onboarding: complete profile */
	@Post('complete')
	@UseGuards(LearnerAuthGuard)
	@ApiResponse({
		status: 200,
		description: 'Profile completed successfully',
	})
	async completeProfile(
		@GetCurrentLearner() learner: LearnerClaims,
		@Body() dto: CompleteProfileDto,
	) {
		await this.profile.completeProfile(learner.id, dto)
		return
	}

	/** 4) Logout */
	@Post('logout')
	@UseGuards(LearnerAuthGuard)
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
	@UseGuards(LearnerAuthGuard)
	@ApiResponse({
		status: 200,
		type: LearnerDto,
		description: 'Returns current learner profile',
	})
	async me(@GetCurrentLearner() learner: LearnerClaims): Promise<LearnerDto> {
		return this.profile.getById(learner.id)
	}
}
