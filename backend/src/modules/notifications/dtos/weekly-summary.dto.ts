import { ApiProperty } from '@nestjs/swagger'

export class WeeklySummaryDto {
	@ApiProperty()
	wordsLearnt!: number

	@ApiProperty({ type: () => WeeklyExercisesDto })
	exercises!: WeeklyExercisesDto

	@ApiProperty({ type: () => WeeklyProgressDto })
	progress!: WeeklyProgressDto

	@ApiProperty({
		required: false,
		description:
			"LLM‑generated short weekly summary in learner's native language (Kazakh/Russian/English)",
	})
	summary?: string
}

export class WeeklyExercisesDto {
	@ApiProperty()
	completed!: number

	@ApiProperty()
	failed!: number
}

export class WeeklyProgressDto {
	@ApiProperty()
	dailyTasksCompleted!: number

	@ApiProperty()
	days!: number
}
