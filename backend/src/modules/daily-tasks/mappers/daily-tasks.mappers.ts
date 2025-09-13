import { DailyTask, DailyTaskExercise, Exercise } from '@prisma/client'
import { DailyTaskDto, DailyTaskExerciseDto } from '../dtos/daily-tasks.dtos'
import { mapToFullExerciseDto } from 'src/modules/exercises/utils/exercises.mapper'

export function mapToDailyTaskDto(
	task: DailyTask & {
		exercises: (DailyTaskExercise & {
			exercise: Exercise
		})[]
	},
): DailyTaskDto {
	return {
		id: task.id,
		createdAt: task.createdAt,
		completedCount: task.exercises.filter(e => e.completed).length,
		allCount: task.exercises.length,
	}
}

export function mapToDailyTaskExerciseDto(
	exercise: DailyTaskExercise & {
		exercise: Exercise
	},
): DailyTaskExerciseDto {
	return {
		id: exercise.id,
		exercise: mapToFullExerciseDto(exercise.exercise),
		dailyTaskId: exercise.dailyTaskId,
		completed: exercise.completed,
	}
}
