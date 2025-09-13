// src/modules/auth/user/services/user-profile.service.ts

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { CompleteProfileDto, UserDto } from '../dtos/users-auth.dtos'
import { toUserDto } from '../utils/users.mapper'

@Injectable()
export class UsersProfileService {
	constructor(private readonly prisma: PrismaService) {}

	/** Find user by phone (for OTP verify) */
	async findByPhone(phone: string): Promise<{ id: number }> {
		const user = await this.prisma.user.findUnique({
			where: { phoneNumber: phone },
			select: { id: true },
		})
		if (!user) throw new UnauthorizedException('No such user')
		return user
	}

	/** Complete onboarding */
	async completeProfile(userId: number, dto: CompleteProfileDto): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				name: dto.name,
			},
		})
	}

	/** “Me” endpoint */
	async getById(userId: number): Promise<UserDto> {
		const raw = await this.prisma.user.findUnique({
			where: { id: userId },
		})

		if (!raw) {
			throw new NotFoundException(`User #${userId} not found`)
		}

		return toUserDto(raw)
	}
}
