// src/assessment/assessment.controller.ts

import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { ParseJsonPipe } from 'src/common/pipes/parse-json.pipe'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { createImageUploadConfig, FILE_SIZE_LIMITS } from 'src/common/utils/file-upload.helper'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import { validateDto } from 'src/common/utils/validation.util'
import { AssessmentService } from './assessment.service'
import {
	AdminAssessmentQuestionDto,
	AssessmentQuestionDto,
	AssessmentTestAdminFilter,
	AssessmentTestDto,
	AssessmentTestFilter,
	SubmitAssessmentTestDto,
	SubmitAssessmentTestResponseDto,
	UpsertQuestionDto,
} from './dtos/assessment.dtos'

@Controller('assessment-test')
export class AssessmentController {
	constructor(private readonly svc: AssessmentService) {}

	/**
	 * Learner: fetch a randomized, evenly‐distributed quiz with translations
	 * GET /assessment-test?amount=10&selfLevel=MEDIUM
	 */
	@Get()
	@UseGuards(LearnerAuthGuard)
	async fetchForLearner(
		@Query() filter: AssessmentTestFilter,
		@GetCurrentLearner() learner: LearnerClaims,
	): Promise<AssessmentTestDto> {
		return this.svc.getTestForLearner(filter, learner.nativeLanguage)
	}

	/**
	 * Learner: submit their answers & get back score + assigned level
	 * POST /assessment-test
	 */
	@Post()
	@UseGuards(LearnerAuthGuard)
	async submit(
		@GetCurrentLearner() learner: LearnerClaims,
		@Body() dto: SubmitAssessmentTestDto,
	): Promise<SubmitAssessmentTestResponseDto> {
		return this.svc.submitAssessmentTest(learner.id, dto)
	}

	//
	// ─── ADMIN CRUD FOR QUESTIONS ────────────────────────────────────────────────
	//

	/**
	 * Admin: fetch all questions with answers, for management
	 * GET /assessment-test/questions
	 */
	@Get('questions')
	async fetchAllQuestions(
		@Query() filter: AssessmentTestAdminFilter,
	): Promise<PaginatedResponse<AssessmentQuestionDto>> {
		return this.svc.getAllQuestions(filter)
	}

	@Get('questions/:id')
	async fetchOneQuestion(
		@Param('id', ParseIntPipe) id: number,
	): Promise<AdminAssessmentQuestionDto> {
		return this.svc.getQuestionById(id)
	}

	/**
	 * Create or update a single question + its answers
	 * POST /assessment-test/questions
	 */
	@Post('questions')
	@UseInterceptors(FileInterceptor('image', createImageUploadConfig(FILE_SIZE_LIMITS.MEDIUM)))
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async upsertQuestion(
		@UploadedFile() file: Express.Multer.File,
		@Body('answers', ParseJsonPipe) answers: unknown,
		@Body() rawBody: Omit<UpsertQuestionDto, 'answers'>,
	): Promise<AdminAssessmentQuestionDto> {
		const payload = { ...rawBody, answers }
		const dto = validateDto(UpsertQuestionDto, payload)

		return this.svc.upsertQuestion(dto, file)
	}

	/**
	 * Delete a single question by ID
	 * DELETE /assessment-test/questions/:id
	 */
	@Delete('questions/:id')
	async removeOne(@Param('id', ParseIntPipe) id: number) {
		await this.svc.deleteQuestion(id)
		return { success: true }
	}
}
