// src/modules/segments/interest-segments.controller.ts

import {
	Controller,
	Get,
	Query,
	Param,
	ParseIntPipe,
	Patch,
	Body,
	Delete,
	HttpCode,
	Post,
} from '@nestjs/common'
import {
	InterestSegmentDto,
	UpdateInterestSegmentDto,
	InterestSegmentsFilter,
	GenerateInterestSegmentDto,
	GenerateInterestSegmentsDto,
} from './dtos/segments.dtos'
import { SegmentsService } from './segments.service'
import { PaginatedResponse } from 'src/common/utils/pagination.util'

@Controller('segments/interests')
export class InterestSegmentsController {
	constructor(private readonly svc: SegmentsService) {}

	// single-interest
	@Post('generate')
	async generateSingle(@Body() dto: GenerateInterestSegmentDto): Promise<InterestSegmentDto> {
		return this.svc.generateInterestSegment(dto)
	}

	// bulk (one per interest)
	@Post('generate/bulk')
	async generateBulk(@Body() dto: GenerateInterestSegmentsDto): Promise<InterestSegmentDto[]> {
		return this.svc.generateInterestSegments(dto)
	}

	@Get()
	async list(
		@Query() filter: InterestSegmentsFilter,
	): Promise<PaginatedResponse<InterestSegmentDto>> {
		return this.svc.listInterestSegments(filter)
	}

	@Get(':id')
	async getOne(@Param('id', ParseIntPipe) id: number): Promise<InterestSegmentDto> {
		return this.svc.findInterestSegment(id)
	}

	@Patch(':id')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateInterestSegmentDto,
	): Promise<InterestSegmentDto> {
		return this.svc.updateInterestSegment(id, dto)
	}

	@Delete(':id')
	@HttpCode(204)
	async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.svc.removeInterestSegment(id)
	}
}
