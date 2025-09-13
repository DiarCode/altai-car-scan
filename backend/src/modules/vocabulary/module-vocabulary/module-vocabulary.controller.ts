// src\modules\vocabulary\module-vocabulary\module-vocabulary.controller.ts

import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Query,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	Patch,
} from '@nestjs/common'
import { ModuleVocabularyService } from './module-vocabulary.service'

import {
	BaseModuleVocabularyDto,
	CreateModuleVocabularyDto,
	UpdateModuleVocabularyDto,
	BulkUpsertModuleVocabularyDto,
	ModuleVocabularyFilterDto,
} from './dtos/module-vocabulary.dtos'

@Controller()
export class ModuleVocabularyController {
	constructor(private readonly svc: ModuleVocabularyService) {}

	@Get('module-vocabulary')
	async listModuleVocabulary(@Query() query: ModuleVocabularyFilterDto) {
		return this.svc.listModuleVocabulary(query)
	}

	@Get('module-vocabulary/:id')
	async getModuleVocabulary(
		@Param('id', ParseIntPipe) id: number,
	): Promise<BaseModuleVocabularyDto> {
		return this.svc.getModuleVocabularyById(id)
	}

	@Post('module-vocabulary')
	async createModuleVocabulary(
		@Body() dto: CreateModuleVocabularyDto,
	): Promise<BaseModuleVocabularyDto> {
		return this.svc.createModuleVocabulary(dto)
	}

	@Patch('module-vocabulary/:id')
	async updateModuleVocabulary(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateModuleVocabularyDto,
	): Promise<BaseModuleVocabularyDto> {
		return this.svc.updateModuleVocabulary(id, dto)
	}

	@Delete('module-vocabulary/:id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async removeModuleVocabulary(@Param('id', ParseIntPipe) id: number) {
		return this.svc.removeModuleVocabulary(id)
	}

	@Post('module-vocabulary/bulk-upsert')
	async bulkUpsertModuleVocabulary(
		@Body() dto: BulkUpsertModuleVocabularyDto,
	): Promise<BaseModuleVocabularyDto[]> {
		return this.svc.bulkUpsertModuleVocabulary(dto)
	}
}
