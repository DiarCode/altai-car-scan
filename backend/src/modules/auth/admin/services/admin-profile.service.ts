import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AdminDto } from '../dtos/admin-auth.dtos'

@Injectable()
export class AdminProfileService {
	constructor(private readonly prisma: PrismaService) {}

	async getById(adminId: number): Promise<AdminDto> {
		const admin = await this.prisma.admin.findUnique({
			where: { id: adminId },
			select: {
				id: true,
				name: true,
				phoneNumber: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		})
		if (!admin) {
			throw new NotFoundException(`Admin #${adminId} not found`)
		}
		return admin
	}

	async getByPhoneOrUnauthorized(phoneNumber: string): Promise<AdminDto> {
		const admin = await this.prisma.admin.findUnique({
			where: { phoneNumber },
		})
		if (!admin) {
			throw new UnauthorizedException('No such admin')
		}
		return admin
	}
}
