import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import { ADMIN_ROLE } from '@prisma/client'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { Roles } from 'src/common/guards/roles.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { ReorderSegmentsDto } from '../segments/dtos/segments.dtos'
import {
	CreateModuleDto,
	ModulesFilter,
	ModuleSummaryDto,
	UpdateModuleDto,
} from './dtos/modules.dtos'
import { ModulesService } from './modules.service'

@Controller('modules')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE.ADMIN, ADMIN_ROLE.TEACHER, ADMIN_ROLE.HELPDESK)
export class ModulesController {
	constructor(private readonly svc: ModulesService) {}

	@Get()
	list(@Query() query: ModulesFilter): Promise<PaginatedResponse<ModuleSummaryDto>> {
		return this.svc.list(query)
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<ModuleSummaryDto> {
		return this.svc.findOne(id)
	}

	@Post()
	create(@Body() dto: CreateModuleDto) {
		return this.svc.create(dto)
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto) {
		return this.svc.update(id, dto)
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.svc.remove(id)
	}

	@Patch(':id/segments/order')
	@HttpCode(204)
	async reorderSegments(
		@Param('id', ParseIntPipe) moduleId: number,
		@Body() dto: ReorderSegmentsDto,
	): Promise<void> {
		return this.svc.reorderSegments(moduleId, dto)
	}
}
