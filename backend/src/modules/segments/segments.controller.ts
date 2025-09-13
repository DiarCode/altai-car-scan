import {
	Controller,
	Post,
	Body,
	HttpCode,
	Get,
	Query,
	Delete,
	Param,
	ParseIntPipe,
	Patch,
	DefaultValuePipe,
	UseGuards,
} from '@nestjs/common'
import { SegmentsService } from './segments.service'
import {
	BaseSegmentDto,
	GenerateSegmentsDto,
	MergeSegmentsDto,
	SegmentDetailDto,
	SegmentsFilter,
	UpdateSegmentDto,
} from './dtos/segments.dtos'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { ADMIN_ROLE } from '@prisma/client'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { Roles } from 'src/common/guards/roles.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'

@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE.ADMIN, ADMIN_ROLE.TEACHER, ADMIN_ROLE.HELPDESK)
@Controller('segments')
export class SegmentsController {
	constructor(private readonly svc: SegmentsService) {}

	@Post('generate')
	@HttpCode(201)
	async generate(@Body() dto: GenerateSegmentsDto): Promise<BaseSegmentDto[]> {
		return this.svc.generate(dto)
	}

	@Get()
	async list(@Query() filter: SegmentsFilter): Promise<PaginatedResponse<BaseSegmentDto>> {
		return this.svc.list(filter)
	}

	@Get(':id')
	async getOne(@Param('id', ParseIntPipe) id: number): Promise<SegmentDetailDto> {
		return this.svc.findOne(id)
	}

	@Patch(':id')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateSegmentDto,
	): Promise<BaseSegmentDto> {
		return this.svc.update(id, dto)
	}

	@Delete(':id')
	@HttpCode(204)
	async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.svc.remove(id)
	}

	@Post(':id/split')
	@HttpCode(201)
	async split(
		@Param('id', ParseIntPipe) id: number,
		@Query('count', new DefaultValuePipe(2), ParseIntPipe) count: number,
	): Promise<BaseSegmentDto[]> {
		return this.svc.split(id, count)
	}

	@Post('merge')
	@HttpCode(201)
	async merge(@Body() dto: MergeSegmentsDto): Promise<BaseSegmentDto> {
		return this.svc.merge(dto)
	}
}
