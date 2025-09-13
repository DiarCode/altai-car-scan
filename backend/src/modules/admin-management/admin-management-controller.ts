import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	ParseIntPipe,
	Patch,
	Delete,
	UseGuards,
	Query,
} from '@nestjs/common'
import { AdminManagementService } from './admin-management.service'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { Roles } from 'src/common/guards/roles.decorator'
import { ADMIN_ROLE } from '@prisma/client'
import { AdminDto, AdminFilter, CreateAdminDto, UpdateAdminDto } from './dtos/admin-management.dtos'
import { PaginatedResponse } from 'src/common/utils/pagination.util'

@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE.ADMIN) // only super-admins
export class AdminManagementController {
	constructor(private readonly service: AdminManagementService) {}

	@Post()
	create(@Body() dto: CreateAdminDto): Promise<AdminDto> {
		return this.service.create(dto)
	}

	@Get()
	async findAll(@Query() filter: AdminFilter): Promise<PaginatedResponse<AdminDto>> {
		return this.service.findAll(filter)
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<AdminDto> {
		return this.service.findOne(id)
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminDto): Promise<AdminDto> {
		return this.service.update(id, dto)
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.service.remove(id)
	}
}
