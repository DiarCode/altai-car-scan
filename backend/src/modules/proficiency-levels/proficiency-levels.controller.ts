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
	HttpCode,
} from '@nestjs/common'
import { ProficiencyLevelsService } from './proficiency-levels.service'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { Roles } from 'src/common/guards/roles.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { ADMIN_ROLE } from '@prisma/client'
import {
	CreateProficiencyLevelDto,
	UpdateProficiencyLevelDto,
	ReorderModulesDto,
	ProficiencyLevelSummaryDto,
} from './dtos/proficiency-level.dtos'

@Controller('proficiency-levels')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE.ADMIN, ADMIN_ROLE.TEACHER, ADMIN_ROLE.HELPDESK)
export class ProficiencyLevelsController {
	constructor(private readonly svc: ProficiencyLevelsService) {}

	@Get()
	findAll(): Promise<ProficiencyLevelSummaryDto[]> {
		return this.svc.findAll()
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<ProficiencyLevelSummaryDto> {
		return this.svc.findOne(id)
	}

	@Post()
	create(@Body() dto: CreateProficiencyLevelDto) {
		return this.svc.create(dto)
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProficiencyLevelDto) {
		return this.svc.update(id, dto)
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.svc.remove(id)
	}

	@Patch(':id/modules/order')
	@HttpCode(204)
	async reorderModules(@Param('id', ParseIntPipe) levelId: number, @Body() dto: ReorderModulesDto) {
		await this.svc.reorderModules(levelId, dto)
	}
}
