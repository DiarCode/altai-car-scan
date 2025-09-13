import {
	Get,
	NotFoundException,
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
	BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CarAnalysisDto } from './dtos/car-analysis.dto'
import { CarAnalysisMapper } from './utils/car-analysis.mapper'
import { ImageClassificationService } from './image-classification.service'
import { GetCurrentUser } from 'src/common/decorators/get-current-users.decorator'
import { UserClaims } from 'src/common/types/user-request.interface'
import { isClassificationResultValid, isLLMCarAnalysisResultValid } from './interfaces'

@Controller('image-classification')
export class ImageClassificationController {
	private readonly service: ImageClassificationService

	constructor(service: ImageClassificationService) {
		this.service = service
	}

	/**
	 * Accepts a car photo (bytes), calls classification pipeline, and returns LLM analysis.
	 */
	@Post('analyze-car')
	@UseInterceptors(FileInterceptor('image'))
	async analyzeCar(
		@UploadedFile() file: Express.Multer.File,
		@GetCurrentUser() user: UserClaims,
	): Promise<any> {
		if (!file || !file.buffer) {
			throw new BadRequestException('Image file is required')
		}
		// Call classification pipeline with image bytes
		const pipelineResult = await this.service.callClassificationPipeline(file.buffer)
		if (!isClassificationResultValid(pipelineResult)) {
			throw new BadRequestException('Invalid classification pipeline result')
		}
		// Call LLM adapter for car analysis
		const llmResult = await this.service.analyzeCarWithLLM(pipelineResult, user.id)
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
