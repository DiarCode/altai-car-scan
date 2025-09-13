import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { GetCurrentLearner } from 'src/common/decorators/get-current-learner.decorator'
import { LearnerClaims } from 'src/common/types/learner-request.interface'
import { ChatService } from './chat.service'
import {
	ChatMessagesQueryDto,
	ChatMessagesResponseDto,
	ChatResponseDto,
	SendCommandDto,
	SendChatMessageDto,
	SubmitExerciseAnswerDto,
	ChatSessionDto, // Import ChatSessionDto
} from './dtos/chat.dtos'
import {
	SubmitClozeDto,
	SubmitMultipleChoiceDto,
	SubmitSentenceReorderDto,
	SubmitDictationDto,
	SubmitListeningQuizDto,
	SubmitPictureDescriptionDto,
	SubmitFlashcardDto,
	BaseSubmitDto,
} from 'src/modules/exercise-validation/dtos/submission.dtos'
import { ModulesFilter, ModuleSummaryDto } from '../modules/dtos/modules.dtos'
import { ProficiencyLevelSummaryDto } from '../proficiency-levels/dtos/proficiency-level.dtos'
import { ModuleDto } from './dtos/chat.dtos'

@ApiTags('Chat')
@Controller('learner')
@UseGuards(LearnerAuthGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('learner-modules')
	@ApiOperation({ summary: "Get the learner's modules" })
	@ApiResponse({ status: 200, type: [ModuleSummaryDto] })
	async getModules(@GetCurrentLearner() learner: LearnerClaims): Promise<ModuleDto[]> {
		return this.chatService.getModulesForLearner(learner.id)
	}

	@Get('modules')
	@ApiOperation({ summary: 'Get all modules for the learner side, regardless of assigned level' })
	@ApiResponse({ status: 200, type: [ModuleDto] })
	async getAllModules(
		@GetCurrentLearner() learner: LearnerClaims,
		@Query() query: ModulesFilter,
	): Promise<ModuleDto[]> {
		return this.chatService.getAllModulesForLearner(learner.id, query)
	}

	@Get('levels')
	@ApiOperation({ summary: 'Get all proficiency levels with their modules for the learner side' })
	@ApiResponse({ status: 200, type: [ProficiencyLevelSummaryDto] })
	async getAllProficiencyLevelsWithModules(): Promise<ProficiencyLevelSummaryDto[]> {
		return this.chatService.getAllProficiencyLevelsWithModulesForLearner()
	}

	@Get('latest-module')
	@ApiOperation({ summary: 'Get the latest module' })
	@ApiResponse({ status: 200, type: ModuleDto })
	async getLatestModule(@GetCurrentLearner() learner: LearnerClaims): Promise<ModuleDto> {
		return this.chatService.getLatestModuleForLearner(learner.id)
	}

	@Post('session/:moduleId')
	@ApiOperation({ summary: 'Start or resume a chat session for a module' })
	@ApiResponse({ status: 200, type: ChatSessionDto })
	async startSession(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
	): Promise<ChatSessionDto> {
		return this.chatService.startOrGetSession(learner.id, moduleId)
	}

	@Get('session/:moduleId/messages')
	@ApiOperation({ summary: 'Get chat messages for a session with pagination' })
	@ApiResponse({ status: 200, type: ChatMessagesResponseDto })
	async getMessages(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Query() query: ChatMessagesQueryDto,
	): Promise<ChatMessagesResponseDto> {
		return this.chatService.getMessages(learner.id, moduleId, query)
	}

	@Post('chat/:moduleId/segment')
	@ApiOperation({ summary: 'Get the next segment' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async getNextSegment(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
	): Promise<ChatResponseDto> {
		return this.chatService.getNextSegment(learner.id, moduleId)
	}

	@Post('chat/:moduleId/exercise')
	@ApiOperation({ summary: 'Get the next exercise' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async getNextExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
	): Promise<ChatResponseDto> {
		return this.chatService.getNextExercise(learner.id, moduleId)
	}

	@Post('chat/:moduleId/exercise/submit')
	@ApiOperation({ summary: 'Submit an exercise answer' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async submitExerciseAnswer(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitExerciseAnswerDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/pronunciation/submit')
	@UseInterceptors(FileInterceptor('audio'))
	async submitPronunciationExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@UploadedFile() file: Express.Multer.File,
		@Body() body: BaseSubmitDto,
	): Promise<ChatResponseDto> {
		// Delegate to chat service which will orchestrate saving attempt + validation
		return this.chatService.submitPronunciationExercise(learner.id, moduleId, file, body)
	}

	// Per-type JSON endpoints (forward to generic submit)
	@Post('chat/:moduleId/exercise/cloze/submit')
	async submitClozeExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitClozeDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/multiple-choice/submit')
	async submitMultipleChoiceExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitMultipleChoiceDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/sentence-reorder/submit')
	async submitSentenceReorderExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitSentenceReorderDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/dictation/submit')
	async submitDictationExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitDictationDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/listening-quiz/submit')
	async submitListeningQuizExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitListeningQuizDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/picture-description/submit')
	async submitPictureDescriptionExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitPictureDescriptionDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/exercise/flashcard/submit')
	async submitFlashcardExercise(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SubmitFlashcardDto,
	): Promise<ChatResponseDto> {
		return this.chatService.submitExerciseAnswer(learner.id, moduleId, dto)
	}

	@Post('chat/:moduleId/explain')
	@ApiOperation({ summary: 'Explain a word or phrase' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async explainVocabulary(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SendCommandDto,
	): Promise<ChatResponseDto> {
		return this.chatService.explainVocabulary(learner, dto)
	}

	@Post('chat/:moduleId/memorize')
	@ApiOperation({ summary: 'Memorize a word or phrase' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async memorizeVocabulary(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SendCommandDto,
	): Promise<ChatResponseDto> {
		return this.chatService.memorizeVocabulary(learner, dto)
	}

	@Post('chat/:moduleId/message')
	@ApiOperation({ summary: 'Send a message' })
	@ApiResponse({ status: 200, type: ChatResponseDto })
	async sendMessage(
		@GetCurrentLearner() learner: LearnerClaims,
		@Param('moduleId') moduleId: number,
		@Body() dto: SendChatMessageDto,
	): Promise<ChatResponseDto> {
		return this.chatService.sendMessage(learner.id, moduleId, dto)
	}
}
