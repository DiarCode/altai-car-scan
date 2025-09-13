import { Injectable } from '@nestjs/common'
import { EXERCISE_TYPE } from '@prisma/client'
import { ExercisesAdapter } from 'src/modules/exercises/adapters/exercise-adapter.interface'
import { AdapterExerciseDto } from 'src/modules/exercises/adapters/exercise-adapter.types'

@Injectable()
export class StubExercisesAdapter implements ExercisesAdapter {
	async generateExercise<T extends EXERCISE_TYPE>(
		interestSegmentId: number,
		type: T,
	): Promise<Array<AdapterExerciseDto<T>>> {
		const now = Date.now()

		// Add await to satisfy async requirement
		await Promise.resolve()

		switch (type) {
			case EXERCISE_TYPE.FLASHCARD:
				return [
					{
						title: 'Stub Flashcard',
						type,
						payload: {
							cards: [{ word: 'кітап', definition: 'book', exampleSentence: 'Мен кітап оқимын.' }],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.CLOZE:
				return [
					{
						title: 'Stub Cloze',
						type,
						payload: {
							sentences: [{ text: 'Мен ___ оқимын.', answers: ['кітап'] }],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.SENTENCE_REORDER:
				return [
					{
						title: 'Stub Reorder',
						type,
						payload: {
							fragments: ['Мен', 'кітап', 'оқимын'],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.MULTIPLE_CHOICE:
				return [
					{
						title: 'Stub Multiple Choice',
						type,
						payload: {
							questions: [
								{
									question: 'Дұрыс жауапты таңдаңыз:',
									options: [
										{ answer: 'Мен кітап оқимын.', isCorrect: true },
										{ answer: 'Кітап мен оқимын.', isCorrect: false },
									],
								},
							],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.DICTATION:
				return [
					{
						title: 'Stub Dictation',
						type,
						payload: {
							transcript: 'Мен кітап оқимын.',
							audioUrl: `mock/audio/${now}.mp3`,
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.LISTENING_QUIZ:
				return [
					{
						title: 'Stub Listening Quiz',
						type,
						payload: {
							questions: [
								{
									question: 'Не істеп жатыр?',
									audioUrl: `mock/audio/${now}.mp3`,
									options: [
										{ answer: 'Кітап оқып жатыр.', correct: true },
										{ answer: 'Ойнап жатыр.', correct: false },
									],
								},
							],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.PRONUNCIATION:
				return [
					{
						title: 'Stub Pronunciation',
						type,
						payload: {
							text: 'Сәлеметсіз бе!',
							audioUrl: `mock/audio/${now}.mp3`,
						},
					},
				] as Array<AdapterExerciseDto<T>>

			case EXERCISE_TYPE.PICTURE_DESCRIPTION:
				return [
					{
						title: 'Stub Picture Description',
						type,
						payload: {
							prompt: 'Адам кітап оқып отыр.',
							imageUrl: `mock/image/${now}.webp`,
							expectedKeywords: ['адам', 'кітап', 'оқып отыр'],
						},
					},
				] as Array<AdapterExerciseDto<T>>

			default:
				throw new Error(`Stub not implemented for type: ${type}`)
		}
	}
}
