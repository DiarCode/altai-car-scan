import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	ParseIntPipe,
	// UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'
// import { ADMIN_ROLE } from '@prisma/client'
// import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
// import { Roles } from 'src/common/guards/roles.decorator'
// import { RolesGuard } from 'src/common/guards/roles.guard'
import {
	CreateSegmentTranslationDto,
	SegmentTranslationDto,
	GenerateTranslationsDto,
	TranslationFilter,
	SegmentWithTranslationsDto,
	UpdateSegmentTranslationDto,
	CreateInterestSegmentTranslationDto,
	InterestSegmentTranslationDto,
	InterestSegmentWithTranslationsDto,
	UpdateInterestSegmentTranslationDto,
	CreateExerciseTranslationDto,
	ExerciseTranslationDto,
	ExerciseWithTranslationsDto,
	UpdateExerciseTranslationDto,
	AssessmentQuestionTranslationDto,
	AssessmentQuestionWithTranslationsDto,
	CreateAssessmentQuestionTranslationDto,
	UpdateAssessmentQuestionTranslationDto,
} from './dtos/translations.dtos'
import { TranslationsService } from './translations.service'

@ApiTags('admin/translations')
@Controller('admin/translations')
// @UseGuards(AdminAuthGuard, RolesGuard)
// @Roles(ADMIN_ROLE.ADMIN, ADMIN_ROLE.TEACHER)
export class TranslationsController {
	constructor(private readonly translationsService: TranslationsService) {}

	// ========== Segment Translations ==========
	@Post('segments')
	@ApiOperation({ summary: 'Create or update a segment translation' })
	async createSegmentTranslation(
		@Body() dto: CreateSegmentTranslationDto,
	): Promise<SegmentTranslationDto> {
		return this.translationsService.createSegmentTranslation(dto)
	}

	@Post('segments/:segmentId/generate')
	@ApiOperation({ summary: 'Generate AI translations for a segment' })
	@ApiParam({ name: 'segmentId', type: 'number' })
	async generateSegmentTranslations(
		@Param('segmentId', ParseIntPipe) segmentId: number,
		@Body() dto: GenerateTranslationsDto,
	): Promise<SegmentTranslationDto[]> {
		return this.translationsService.generateSegmentTranslations(segmentId, dto)
	}

	@Get('segments/:segmentId')
	@ApiOperation({ summary: 'Get all translations for a segment' })
	@ApiParam({ name: 'segmentId', type: 'number' })
	async getSegmentTranslations(
		@Param('segmentId', ParseIntPipe) segmentId: number,
		@Query() filter?: TranslationFilter,
	): Promise<SegmentTranslationDto[]> {
		return this.translationsService.getSegmentTranslations(segmentId, filter)
	}

	@Get('segments/:segmentId/full')
	@ApiOperation({ summary: 'Get segment with all translations' })
	@ApiParam({ name: 'segmentId', type: 'number' })
	async getSegmentWithTranslations(
		@Param('segmentId', ParseIntPipe) segmentId: number,
	): Promise<SegmentWithTranslationsDto> {
		return this.translationsService.getSegmentWithTranslations(segmentId)
	}

	@Patch('segments/translations/:id')
	@ApiOperation({ summary: 'Update a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	async updateSegmentTranslation(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateSegmentTranslationDto,
	): Promise<SegmentTranslationDto> {
		return this.translationsService.updateSegmentTranslation(id, dto)
	}

	@Delete('segments/translations/:id')
	@ApiOperation({ summary: 'Delete a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteSegmentTranslation(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.translationsService.deleteSegmentTranslation(id)
	}

	// ========== Interest Segment Translations ==========
	@Post('interest-segments')
	@ApiOperation({ summary: 'Create or update an interest segment translation' })
	async createInterestSegmentTranslation(
		@Body() dto: CreateInterestSegmentTranslationDto,
	): Promise<InterestSegmentTranslationDto> {
		return this.translationsService.createInterestSegmentTranslation(dto)
	}

	@Post('interest-segments/:interestSegmentId/generate')
	@ApiOperation({ summary: 'Generate AI translations for an interest segment' })
	@ApiParam({ name: 'interestSegmentId', type: 'number' })
	async generateInterestSegmentTranslations(
		@Param('interestSegmentId', ParseIntPipe) interestSegmentId: number,
		@Body() dto: GenerateTranslationsDto,
	): Promise<InterestSegmentTranslationDto[]> {
		return this.translationsService.generateInterestSegmentTranslations(interestSegmentId, dto)
	}

	@Get('interest-segments/:interestSegmentId')
	@ApiOperation({ summary: 'Get all translations for an interest segment' })
	@ApiParam({ name: 'interestSegmentId', type: 'number' })
	async getInterestSegmentTranslations(
		@Param('interestSegmentId', ParseIntPipe) interestSegmentId: number,
		@Query() filter?: TranslationFilter,
	): Promise<InterestSegmentTranslationDto[]> {
		return this.translationsService.getInterestSegmentTranslations(interestSegmentId, filter)
	}

	@Get('interest-segments/:interestSegmentId/full')
	@ApiOperation({ summary: 'Get interest segment with all translations' })
	@ApiParam({ name: 'interestSegmentId', type: 'number' })
	async getInterestSegmentWithTranslations(
		@Param('interestSegmentId', ParseIntPipe) interestSegmentId: number,
	): Promise<InterestSegmentWithTranslationsDto> {
		return this.translationsService.getInterestSegmentWithTranslations(interestSegmentId)
	}

	@Patch('interest-segments/translations/:id')
	@ApiOperation({ summary: 'Update a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	async updateInterestSegmentTranslation(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateInterestSegmentTranslationDto,
	): Promise<InterestSegmentTranslationDto> {
		return this.translationsService.updateInterestSegmentTranslation(id, dto)
	}

	@Delete('interest-segments/translations/:id')
	@ApiOperation({ summary: 'Delete a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteInterestSegmentTranslation(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.translationsService.deleteInterestSegmentTranslation(id)
	}

	// ========== Exercise Translations ==========
	@Post('exercises')
	@ApiOperation({ summary: 'Create or update an exercise translation' })
	async createExerciseTranslation(
		@Body() dto: CreateExerciseTranslationDto,
	): Promise<ExerciseTranslationDto> {
		return this.translationsService.createExerciseTranslation(dto)
	}

	@Post('exercises/:exerciseId/generate')
	@ApiOperation({ summary: 'Generate AI translations for an exercise' })
	@ApiParam({ name: 'exerciseId', type: 'number' })
	async generateExerciseTranslations(
		@Param('exerciseId', ParseIntPipe) exerciseId: number,
		@Body() dto: GenerateTranslationsDto,
	): Promise<ExerciseTranslationDto[]> {
		return this.translationsService.generateExerciseTranslations(exerciseId, dto)
	}

	@Get('exercises/:exerciseId')
	@ApiOperation({ summary: 'Get all translations for an exercise' })
	@ApiParam({ name: 'exerciseId', type: 'number' })
	async getExerciseTranslations(
		@Param('exerciseId', ParseIntPipe) exerciseId: number,
		@Query() filter?: TranslationFilter,
	): Promise<ExerciseTranslationDto[]> {
		return this.translationsService.getExerciseTranslations(exerciseId, filter)
	}

	@Get('exercises/:exerciseId/full')
	@ApiOperation({ summary: 'Get exercise with all translations' })
	@ApiParam({ name: 'exerciseId', type: 'number' })
	async getExerciseWithTranslations(
		@Param('exerciseId', ParseIntPipe) exerciseId: number,
	): Promise<ExerciseWithTranslationsDto> {
		return this.translationsService.getExerciseWithTranslations(exerciseId)
	}

	@Patch('exercises/translations/:id')
	@ApiOperation({ summary: 'Update a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	async updateExerciseTranslation(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateExerciseTranslationDto,
	): Promise<ExerciseTranslationDto> {
		return this.translationsService.updateExerciseTranslation(id, dto)
	}

	@Delete('exercises/translations/:id')
	@ApiOperation({ summary: 'Delete a specific translation' })
	@ApiParam({ name: 'id', type: 'number' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteExerciseTranslation(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.translationsService.deleteExerciseTranslation(id)
	}

	// ========== Assessment Question Translations ==========
	@Post('assessment-questions')
	@ApiOperation({
		summary: 'Create or update an assessment question translation (includes all answers)',
	})
	async createAssessmentQuestionTranslation(
		@Body() dto: CreateAssessmentQuestionTranslationDto,
	): Promise<AssessmentQuestionTranslationDto> {
		return this.translationsService.createAssessmentQuestionTranslation(dto)
	}

	@Post('assessment-questions/:questionId/generate')
	@ApiOperation({
		summary: 'Generate AI translations for an assessment question and all its answers',
	})
	@ApiParam({ name: 'questionId', type: 'number' })
	async generateAssessmentQuestionTranslations(
		@Param('questionId', ParseIntPipe) questionId: number,
		@Body() dto: GenerateTranslationsDto,
	): Promise<AssessmentQuestionTranslationDto[]> {
		return this.translationsService.generateAssessmentQuestionTranslations(questionId, dto)
	}

	@Get('assessment-questions/:questionId')
	@ApiOperation({ summary: 'Get all translations for an assessment question' })
	@ApiParam({ name: 'questionId', type: 'number' })
	async getAssessmentQuestionTranslations(
		@Param('questionId', ParseIntPipe) questionId: number,
		@Query() filter?: TranslationFilter,
	): Promise<AssessmentQuestionTranslationDto[]> {
		return this.translationsService.getAssessmentQuestionTranslations(questionId, filter)
	}

	@Get('assessment-questions/:questionId/full')
	@ApiOperation({ summary: 'Get assessment question with all translations' })
	@ApiParam({ name: 'questionId', type: 'number' })
	async getAssessmentQuestionWithTranslations(
		@Param('questionId', ParseIntPipe) questionId: number,
	): Promise<AssessmentQuestionWithTranslationsDto> {
		return this.translationsService.getAssessmentQuestionWithTranslations(questionId)
	}

	@Patch('assessment-questions/translations/:id')
	@ApiOperation({ summary: 'Update a specific assessment question translation' })
	@ApiParam({ name: 'id', type: 'number' })
	async updateAssessmentQuestionTranslation(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateAssessmentQuestionTranslationDto,
	): Promise<AssessmentQuestionTranslationDto> {
		return this.translationsService.updateAssessmentQuestionTranslation(id, dto)
	}

	@Delete('assessment-questions/translations/:id')
	@ApiOperation({
		summary: 'Delete assessment question translation (includes all answer translations)',
	})
	@ApiParam({ name: 'id', type: 'number' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteAssessmentQuestionTranslation(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.translationsService.deleteAssessmentQuestionTranslation(id)
	}
}
