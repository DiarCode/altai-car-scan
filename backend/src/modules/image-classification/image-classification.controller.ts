import { Get, NotFoundException } from '@nestjs/common'
import { CarAnalysisDto } from './dtos/car-analysis.dto'
import { CarAnalysisMapper } from './utils/car-analysis.mapper'

import {
	Controller,
	Post,
	UploadedFiles,
	UseInterceptors,
	BadRequestException,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import {
	ImageClassificationService,
	isClassificationResultValid,
	isLLMCarAnalysisResultValid,
} from './image-classification.service'
import { GetCurrentUser } from 'src/common/decorators/get-current-users.decorator'
import { UserClaims } from 'src/common/types/user-request.interface'

@Controller('image-classification')
export class ImageClassificationController {
	private readonly service: ImageClassificationService

	constructor(service: ImageClassificationService) {
		this.service = service
	}

	/**
	 * Accepts 4 car photos (front, back, left, right), uploads to S3, calls classification pipeline, and returns results.
	 */
	@Post('analyze-car')
	@UseInterceptors(AnyFilesInterceptor())
	async analyzeCar(
		@UploadedFiles() files: Express.Multer.File[],
		@GetCurrentUser() user: UserClaims,
	) {
		// Validate 4 files
		if (!files || files.length !== 4) {
			throw new BadRequestException('Exactly 4 images required: front, back, left, right')
		}
		const angles = ['front', 'back', 'left', 'right']
		const s3Keys: string[] = []
		for (let i = 0; i < 4; i++) {
			const file = files[i]
			const key = `user-${user.id}/images/${angles[i]}-${Date.now()}.jpg`
			await this.service.uploadImageToS3(key, file.buffer)
			s3Keys.push(key)
		}
		// Call classification pipeline
		const pipelineResult = await this.service.callClassificationPipeline(s3Keys)
		// Validate result structure (type guard)
		if (!isClassificationResultValid(pipelineResult)) {
			throw new BadRequestException('Invalid classification pipeline result')
		}
		// Call LLM adapter for car analysis
		const llmResult = await this.service.analyzeCarWithLLM(pipelineResult, user.id)
		// Validate LLM result
		if (!isLLMCarAnalysisResultValid(llmResult)) {
			throw new BadRequestException('Invalid LLM analysis result')
		}
		return llmResult
	}

	@Get('latest')
	async getLatestAnalysis(@GetCurrentUser() user: UserClaims): Promise<CarAnalysisDto> {
		const analysis = await this.service.getLatestAnalysis(user.id)
		if (!analysis) throw new NotFoundException('No analysis found')
		return CarAnalysisMapper.toDto(analysis)
	}
}
