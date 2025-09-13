// src/modules/auth/user/utils/user.mapper.ts

import { User as PrismaUser } from '@prisma/client'
import { UserDto } from '../dtos/users-auth.dtos'

export function toUserDto(raw: PrismaUser): UserDto {
	return {
		id: raw.id,
		name: raw.name,
		phoneNumber: raw.phoneNumber,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
	}
}
