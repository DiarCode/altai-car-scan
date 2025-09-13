// src/modules/auth/learner/services/learner-profile.service.ts

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CompleteProfileDto, LearnerDto } from '../dtos/learner-auth.dtos'
import { toLearnerDto } from '../utils/learner.mapper'
import { LEVEL_CODE } from '@prisma/client'
import { NotificationsApi } from 'src/modules/notifications/notifications.service'

@Injectable()
export class LearnerProfileService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsApi: NotificationsApi,
	) {}

	/** Find learner by phone (for OTP verify) */
	async findByPhone(phone: string): Promise<{ id: number; verified: boolean }> {
		const learner = await this.prisma.learner.findUnique({
			where: { phoneNumber: phone },
			select: { id: true, verified: true },
		})
		if (!learner) throw new UnauthorizedException('No such learner')
		return learner
	}

	/** Complete onboarding */
	async completeProfile(learnerId: number, dto: CompleteProfileDto): Promise<void> {
		await this.prisma.learner.update({
			where: { id: learnerId },
			data: {
				name: dto.name,
				nativeLanguage: dto.nativeLanguage,
				interests: dto.interests,
				assignedLevel: { connect: { code: LEVEL_CODE.A1 } },
				dailyTimeGoal: dto.dailyTimeGoal || 15, // Default to 15 minutes if not provided
				verified: true, // Mark as verified after profile completion
			},
		})
		// Send onboarding welcome notification (localized)
		await this.notificationsApi.onboardingWelcome(learnerId, dto.name)
	}

	/** “Me” endpoint */
	async getById(learnerId: number): Promise<LearnerDto> {
		const raw = await this.prisma.learner.findUnique({
			where: { id: learnerId },
			include: {
				assignedLevel: true,
			},
		})

		if (!raw) {
			throw new NotFoundException(`Learner #${learnerId} not found`)
		}

		if (!raw.assignedLevel) {
			throw new NotFoundException(`Assigned level for learner #${learnerId} not found`)
		}

		return toLearnerDto(raw)
	}
}
