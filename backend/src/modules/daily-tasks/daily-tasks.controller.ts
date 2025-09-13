import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	UseGuards,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { DailyTasksService } from './daily-tasks.service'
import {
	DailyTaskDto,
	DailyTaskExerciseDto,
	SubmitDailyTaskExerciseDto,
} from './dtos/daily-tasks.dtos'
import {
	SubmitClozeDto,
	SubmitMultipleChoiceDto,
	SubmitSentenceReorderDto,
	SubmitDictationDto,
	SubmitListeningQuizDto,
	SubmitPictureDescriptionDto,
	SubmitFlashcardDto,
} from 'src/modules/exercise-validation/dtos/submission.dtos'
import { mapToDailyTaskDto, mapToDailyTaskExerciseDto } from './mappers/daily-tasks.mappers'
import { LearnerClaims } from 'src/common/types/learner-request.interface'

@ApiTags('daily-tasks')
@Controller('daily-tasks')
@UseGuards(LearnerAuthGuard)
export class DailyTasksController {
	constructor(private readonly dailyTasksService: DailyTasksService) {}

	@Get()
	async getDailyTask(@GetCurrentLearner() learner: LearnerClaims): Promise<DailyTaskDto> {
		const task = await this.dailyTasksService.getDailyTask(learner.id)
		return mapToDailyTaskDto(task)
	}

	@Get('exercises')
	async getDailyTaskExercises(
		@GetCurrentLearner() learner: LearnerClaims,
	): Promise<DailyTaskExerciseDto[]> {
		const task = await this.dailyTasksService.getDailyTask(learner.id)
		const exercises = await this.dailyTasksService.getDailyTaskExercises(task.id)
		return exercises.map(mapToDailyTaskExerciseDto)
	}

	@Post(':dailyTaskId/submit')
	async submitDailyTaskExercise(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitDailyTaskExerciseDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	// Per-type JSON endpoints
	@Post(':dailyTaskId/exercise/cloze/submit')
	async submitCloze(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitClozeDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/multiple-choice/submit')
	async submitMultipleChoice(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitMultipleChoiceDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/sentence-reorder/submit')
	async submitSentenceReorder(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitSentenceReorderDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/dictation/submit')
	async submitDictation(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitDictationDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/listening-quiz/submit')
	async submitListeningQuiz(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitListeningQuizDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/picture-description/submit')
	async submitPictureDescription(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitPictureDescriptionDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/exercise/flashcard/submit')
	async submitFlashcard(
		@Param('dailyTaskId') dailyTaskId: number,
		@Body() dto: SubmitFlashcardDto,
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitDailyTaskExercise(learner.id, dailyTaskId, dto)
	}

	@Post(':dailyTaskId/pronunciation/submit')
	@UseInterceptors(FileInterceptor('audio'))
	async submitPronunciation(
		@Param('dailyTaskId') dailyTaskId: number,
		@UploadedFile() file: Express.Multer.File,
		@Body()
		body: {
			exerciseId: number
			attemptId?: string
			attemptNumber?: number
			isDontKnow?: boolean
			language?: string
		},
		@GetCurrentLearner() learner: LearnerClaims,
	) {
		return this.dailyTasksService.submitPronunciationExercise(learner.id, dailyTaskId, file, body)
	}
}
