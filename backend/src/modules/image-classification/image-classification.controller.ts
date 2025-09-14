import {
	Get,
	NotFoundException,
	Controller,
	Post,
	UploadedFiles,
	UseInterceptors,
	BadRequestException,
	UseGuards,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { CarAnalysisDto } from './dtos/car-analysis.dto'
import { CarAnalysisMapper } from './utils/car-analysis.mapper'
import { ImageClassificationService } from './image-classification.service'
import { GetCurrentUser } from 'src/common/decorators/get-current-users.decorator'
import { UserClaims } from 'src/common/types/user-request.interface'
import {
	isClassificationResultValid,
	isLLMCarAnalysisResultValid,
	isMultiClassificationResultValid,
	LLMCarAnalysisResult,
	ClassificationPipelineResult,
} from './interfaces'
import { UsersAuthGuard } from 'src/common/guards/users-auth.guard'

@UseGuards(UsersAuthGuard)
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
	@UseInterceptors(AnyFilesInterceptor())
	async analyzeCar(
		@UploadedFiles() files: Express.Multer.File[],
		@GetCurrentUser() user: UserClaims,
	): Promise<LLMCarAnalysisResult> {
		if (!files || files.length === 0 || files.length > 4) {
			throw new BadRequestException('Provide between 1 and 4 images: front, back, left, right')
		}
		const buffers = files.map(f => f.buffer).filter(Boolean)
		if (buffers.length !== files.length) {
			throw new BadRequestException('One or more images are invalid')
		}
		let pipelineResult: ClassificationPipelineResult | ClassificationPipelineResult[]
		if (buffers.length === 1) {
			const single = await this.service.callClassificationPipeline(buffers[0])
			if (!isClassificationResultValid(single)) {
				throw new BadRequestException('Invalid classification pipeline result')
			}
			pipelineResult = single
		} else {
			const multi = await this.service.callClassificationPipelineMulti(buffers)
			if (!isMultiClassificationResultValid(multi) || multi.length !== buffers.length) {
				throw new BadRequestException('Failed to classify all images')
			}
			pipelineResult = multi
		}
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
