import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator'
import { ExerciseDto } from 'src/modules/exercises/dtos/exercises.dtos'

export class DailyTaskDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	completedCount: number

	@ApiProperty()
	allCount: number
}

export class SubmitDailyTaskExerciseDto {
	@ApiProperty()
	@IsInt()
	@IsNotEmpty()
	exerciseId: number

	@ApiProperty()
	@IsOptional()
	answer?: unknown

	@ApiProperty()
	@IsOptional()
	isDontKnow?: boolean
}

export class DailyTaskExerciseDto {
	@ApiProperty()
	id: number

	@ApiProperty()
	exercise: ExerciseDto

	@ApiProperty()
	dailyTaskId: number

	@ApiProperty()
	completed: boolean
}
