import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { ADMIN_ROLE } from '@prisma/client'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { Roles } from 'src/common/guards/roles.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { PaginatedResponse } from 'src/common/utils/pagination.util'
import {
	BaseExerciseDto,
	ChangeExerciseStatusDto,
	ExerciseDto,
	ExercisesFilter,
	GenerateExerciseDto,
} from './dtos/exercises.dtos'
import { ExercisesService } from './exercises.service'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { parseUpdateExerciseMultipartBody } from './utils/parse-multipart'

@Controller('exercises')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(ADMIN_ROLE.ADMIN, ADMIN_ROLE.TEACHER, ADMIN_ROLE.HELPDESK)
export class ExercisesController {
	constructor(private readonly svc: ExercisesService) {}

	@Post('generate')
	async generate(@Body() dto: GenerateExerciseDto): Promise<ExerciseDto[]> {
		return this.svc.generateExercises(dto)
	}

	@Get()
	async list(@Query() filter: ExercisesFilter): Promise<PaginatedResponse<BaseExerciseDto>> {
		return this.svc.listExercises(filter)
	}

	@Get(':id')
	async getOne(@Param('id', ParseIntPipe) id: number): Promise<ExerciseDto> {
		return this.svc.getExerciseById(id)
	}

	@Patch(':id')
	@UseInterceptors(
		AnyFilesInterceptor({
			limits: {
				fileSize: 5 * 1024 * 1024, // 5 MB
			},
		}),
	)
	async updateExercise(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFiles() files: Express.Multer.File[],
		@Body() rawBody: Record<string, unknown>,
	) {
		console.log(`Updating exercise with ID ${id}`, {
			files: files.map(f => f.originalname),
			body: rawBody,
		})
		const dto = parseUpdateExerciseMultipartBody(rawBody)
		return this.svc.updateExercise(id, dto, files)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.svc.deleteExercise(id)
	}

	@Patch(':id/status')
	@HttpCode(HttpStatus.OK)
	async changeStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: ChangeExerciseStatusDto,
	): Promise<ExerciseDto> {
		return this.svc.changeStatus(id, dto)
	}
}
