// src/modules/auth/learner/services/learner-profile.service.ts

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CompleteProfileDto, LearnerDto } from '../dtos/users-auth.dtos'
import { toLearnerDto } from '../utils/users.mapper'
import { LEVEL_CODE } from '@prisma/client'

@Injectable()
export class UsersProfileService {
	constructor(private readonly prisma: PrismaService) {}

	/** Find learner by phone (for OTP verify) */
	async findByPhone(phone: string): Promise<{ id: number; verified: boolean }> {
		const learner = await this.prisma.users.findUnique({
			where: { phoneNumber: phone },
			select: { id: true, verified: true },
		})
		if (!learner) throw new UnauthorizedException('No such learner')
		return learner
	}

	/** Complete onboarding */
	async completeProfile(learnerId: number, dto: CompleteProfileDto): Promise<void> {
		await this.prisma.users.update({
			where: { id: learnerId },
			data: {
				name: dto.name,
			},
		})
	}

	/** “Me” endpoint */
	async getById(userId: number): Promise<LearnerDto> {
		const raw = await this.prisma.users.findUnique({
			where: { id: userId },
		})

		if (!raw) {
			throw new NotFoundException(`User #${userId} not found`)
		}

		return toLearnerDto(raw)
	}
}
