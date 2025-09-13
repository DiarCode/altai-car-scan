import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AdminDto, AdminFilter, CreateAdminDto, UpdateAdminDto } from './dtos/admin-management.dtos'
import { paginatePrisma } from 'src/common/utils/prisma-pagination.util'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { mapAdminToDto } from './utils/admin.mapper'
import { Prisma } from '@prisma/client'

@Injectable()
export class AdminManagementService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateAdminDto): Promise<AdminDto> {
		const admin = await this.prisma.admin.create({ data: dto })
		return mapAdminToDto(admin)
	}

	async findAll(filter: AdminFilter): Promise<PaginatedResponse<AdminDto>> {
		const where: Prisma.AdminWhereInput = {}

		if (filter.search) {
			where.OR = [
				{ phoneNumber: { contains: filter.search, mode: 'insensitive' } },
				{ name: { contains: filter.search, mode: 'insensitive' } },
			]
		}

		if (filter.role) {
			where.role = filter.role
		}

		const pageData = await paginatePrisma(
			this.prisma.admin,
			{
				where,
				orderBy: { createdAt: 'desc' },
			},
			this.prisma.admin,
			{ where },
			{
				page: filter.page,
				pageSize: filter.pageSize,
				disablePagination: filter.disablePagination,
			},
		)

		const data = pageData.data.map(admin => mapAdminToDto(admin))
		return {
			data,
			pagination: pageData.pagination,
		}
	}

	async findOne(id: number): Promise<AdminDto> {
		const admin = await this.prisma.admin.findUnique({ where: { id } })
		if (!admin) throw new NotFoundException(`Admin #${id} not found`)
		return mapAdminToDto(admin)
	}

	async update(id: number, dto: UpdateAdminDto) {
		await this.findOne(id)
		const admin = await this.prisma.admin.update({
			where: { id },
			data: dto,
		})

		return mapAdminToDto(admin)
	}

	async remove(id: number) {
		await this.findOne(id)
		return this.prisma.admin.delete({ where: { id } })
	}
}
