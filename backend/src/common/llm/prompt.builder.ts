import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PromptRegistry } from './prompt.registry'
import { EXERCISE_TYPE, INTEREST, NATIVE_LANGUAGE } from '@prisma/client'
import { PromptContextConfigService } from './prompt-context.config'
import {
	applyOptional,
	buildProtectedTerms,
	formatProtectedTerms,
	formatTruncationNotes,
	formatVocabularyList,
	listExistingExercises,
	TruncationNote,
} from './prompt.utils'

export interface BuiltPrompt {
	messages: { role: 'system' | 'user'; content: string }[]
	maxTokens?: number
}

@Injectable()
export class PromptBuilderService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly registry: PromptRegistry,
		private readonly ctxConfig: PromptContextConfigService,
	) {}

	/** Build for /segments/generate using 'theory-segments' template */
	async buildGenerateTemplate(moduleId: number, count?: number): Promise<BuiltPrompt> {
		const tpl = this.registry.get('theory-segments')

		// fetch current module with level + vocab + order
		const mod = await this.prisma.module.findUnique({
			where: { id: moduleId },
			select: {
				id: true,
				order: true,
				title: true,
				description: true,
				outcomes: true,
				theoryContent: true,
				ModuleVocabulary: { select: { word: true } },
				proficiencyLevel: { select: { id: true, code: true, title: true, description: true } },
			},
		})
		if (!mod) throw new NotFoundException(`Module ${moduleId} not found`)

		// previous modules by order within same level
		const prevModules = await this.prisma.module.findMany({
			where: {
				proficiencyLevelId: mod.proficiencyLevel.id,
				order: { lt: mod.order },
			},
			orderBy: { order: 'desc' },
			take: this.ctxConfig.previousModulesLimit,
			select: {
				id: true,
				order: true,
				title: true,
				ModuleVocabulary: { select: { word: true } },
			},
		})

		const truncNotes: TruncationNote[] = []
		const previousModulesStr = prevModules.length
			? prevModules.map(m => `(${m.order}) ${m.title}`).join('\n')
			: 'NONE (this is the first module for this level)'

		const previousVocabAll = prevModules.flatMap(m => m.ModuleVocabulary.map(v => v.word))
		const currentVocabAll = mod.ModuleVocabulary.map(v => v.word)
		const previousVocabularyStr = formatVocabularyList(
			previousVocabAll,
			this.ctxConfig.previousVocabularyLimit,
			truncNotes,
			'previousVocabulary',
		)
		const currentVocabularyStr = formatVocabularyList(
			currentVocabAll,
			this.ctxConfig.currentVocabularyLimit,
			truncNotes,
			'currentVocabulary',
		)
		const protectedTerms = buildProtectedTerms(
			currentVocabAll,
			previousVocabAll,
			this.ctxConfig.protectedTermsExtra,
		)
		const protectedTermsStr = formatProtectedTerms(protectedTerms)
		const truncationNotes = formatTruncationNotes(truncNotes)

		let user = tpl.user
		user = user.replace(/{{count}}/g, String(count ?? 1))
		user = user.replace(/{{proficiencyLevel}}/g, String(mod.proficiencyLevel.code))
		user = user.replace(/{{moduleTitle}}/g, mod.title)
		user = user.replace(/{{moduleDescription}}/g, mod.description)
		user = user.replace(/{{outcomes}}/g, mod.outcomes)
		user = user.replace(/{{theoryContent}}/g, mod.theoryContent)
		user = user.replace(/{{vocabulary}}/g, currentVocabAll.join(', ')) // legacy
		user = applyOptional(user, 'previousModules', previousModulesStr)
		user = applyOptional(user, 'previousVocabulary', previousVocabularyStr)
		user = applyOptional(user, 'currentVocabulary', currentVocabularyStr)
		user = applyOptional(user, 'protectedTerms', protectedTermsStr)
		user = applyOptional(user, 'truncationNotes', truncationNotes)
		user = applyOptional(user, 'levelCode', mod.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', mod.proficiencyLevel.title)
		user = applyOptional(user, 'levelDescription', mod.proficiencyLevel.description)

		let system = tpl.system
		system = applyOptional(system, 'levelCode', mod.proficiencyLevel.code)
		system = applyOptional(system, 'levelTitle', mod.proficiencyLevel.title)

		if (process.env.DEBUG_PROMPTS === 'true') {
			console.log('[PromptBuilder] theory-segments length user=', user.length)
		}

		return {
			messages: [
				{ role: 'system', content: system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	/** Build for GET /segments/:id/split using 'split-segment' template */
	async buildSplitTemplate(segmentId: number, count?: number): Promise<BuiltPrompt> {
		const tpl = this.registry.get('split-segment')

		// fetch the original segment’s content
		const seg = await this.prisma.segment.findUnique({
			where: { id: segmentId },
			select: { theoryContent: true },
		})
		if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`)

		const user = tpl.user
			.replace(/{{segmentId}}/g, String(segmentId))
			.replace(/{{count}}/g, String(count ?? 2))
			.replace(/{{theoryContent}}/g, seg.theoryContent)

		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	/** Build for POST /segments/merge using 'merge-segments' template */
	async buildMergeTemplate(segmentIds: number[]): Promise<BuiltPrompt> {
		const tpl = this.registry.get('merge-segments')

		// fetch titles of all segments in order
		const segs = await this.prisma.segment.findMany({
			where: { id: { in: segmentIds } },
			orderBy: { order: 'asc' },
			select: { id: true, title: true },
		})

		const items = segs.map((s, i) => `${i + 1}. ID=${s.id}: "${s.title}"`).join('\n')

		const user = tpl.user
			.replace(/{{segmentIds}}/g, JSON.stringify(segmentIds))
			.replace(/{{items}}/g, items)

		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	async buildInterestTemplate(segmentId: number, interest: INTEREST): Promise<BuiltPrompt> {
		const tpl = this.registry.get('interest-segment')

		// fetch the base segment’s title and theoryContent
		const seg = await this.prisma.segment.findUnique({
			where: { id: segmentId },
			select: { title: true, theoryContent: true },
		})
		if (!seg) throw new NotFoundException(`Segment ${segmentId} not found`)

		const user = tpl.user
			.replace(/{{segmentTitle}}/g, seg.title)
			.replace(/{{baseTheoryContent}}/g, seg.theoryContent)
			.replace(/{{interest}}/g, String(interest))

		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	/**
	 * Build the system + user messages for generating exercises.
	 *
	 * @param interestSegmentId  the ID of the interest-focused segment
	 * @param type               the exercise type (enum EXERCISE_TYPE)
	 * @param count              how many variations to generate
	 */
	async buildGenerateExercisePrompt(
		interestSegmentId: number,
		type: EXERCISE_TYPE,
		count: number,
	): Promise<BuiltPrompt> {
		const key = `generate-${String(type).toLowerCase().replace('_', '-')}`
		const tpl = this.registry.get(key)

		const interestSeg = await this.prisma.interestSegment.findUnique({
			where: { id: interestSegmentId },
			select: {
				id: true,
				theoryContent: true,
				interest: true,
				segment: {
					select: {
						title: true,
						module: {
							select: {
								ModuleVocabulary: { select: { word: true } },
								proficiencyLevel: {
									select: { code: true, title: true, description: true },
								},
							},
						},
					},
				},
				Exercise: { select: { id: true, type: true, title: true, payload: true } },
			},
		})
		if (!interestSeg) throw new NotFoundException(`InterestSegment ${interestSegmentId} not found`)

		const truncNotes: TruncationNote[] = []
		const segmentTitle = interestSeg.segment.title
		const segmentVocabulary = interestSeg.segment.module.ModuleVocabulary.map(v => v.word)
		const segmentVocabularyStr = formatVocabularyList(
			segmentVocabulary,
			this.ctxConfig.currentVocabularyLimit,
			truncNotes,
			'segmentVocabulary',
		)
		const protectedTermsStr = formatProtectedTerms(
			buildProtectedTerms(segmentVocabulary, [], this.ctxConfig.protectedTermsExtra),
		)
		const existingAll = interestSeg.Exercise
		const existingSame = existingAll.filter(e => e.type === type)
		const existingSameStr = listExistingExercises(
			existingSame,
			{
				limit: this.ctxConfig.existingExercisesLimitSameType,
				maxChars: this.ctxConfig.exercisePayloadSummaryChars,
			},
			truncNotes,
			'existingExercisesSameType',
			type,
		)
		const existingAllStr = listExistingExercises(
			existingAll,
			{
				limit: this.ctxConfig.existingExercisesLimitAll,
				maxChars: this.ctxConfig.exercisePayloadSummaryChars,
			},
			truncNotes,
			'existingExercisesAll',
		)
		const truncationNotes = formatTruncationNotes(truncNotes)
		let user = tpl.user
		user = user.replace(/{{interestSegmentId}}/g, String(interestSegmentId))
		user = user.replace(/{{segmentTitle}}/g, segmentTitle)
		user = user.replace(/{{theoryContent}}/g, interestSeg.theoryContent)
		user = user.replace(/{{interest}}/g, String(interestSeg.interest))
		user = user.replace(/{{count}}/g, String(count))
		user = applyOptional(user, 'segmentVocabulary', segmentVocabularyStr)
		user = applyOptional(user, 'existingExercisesSameType', existingSameStr)
		user = applyOptional(user, 'existingExercisesAll', existingAllStr)
		user = applyOptional(user, 'protectedTerms', protectedTermsStr)
		user = applyOptional(user, 'truncationNotes', truncationNotes)
		user = applyOptional(user, 'levelCode', interestSeg.segment.module.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', interestSeg.segment.module.proficiencyLevel.title)
		user = applyOptional(
			user,
			'levelDescription',
			interestSeg.segment.module.proficiencyLevel.description,
		)
		// style prompt if needed
		if (user.includes('{{stylePrompt}}')) {
			user = user.replace(
				/{{stylePrompt}}/g,
				this.getStylePrompt(type, 0 /* could parameterize later */),
			)
		}
		let system = tpl.system
		system = applyOptional(system, 'levelCode', interestSeg.segment.module.proficiencyLevel.code)
		system = applyOptional(system, 'levelTitle', interestSeg.segment.module.proficiencyLevel.title)
		return {
			messages: [
				{ role: 'system', content: system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	async buildTranslateSegmentTemplate(
		segmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<BuiltPrompt> {
		const tpl = this.registry.get('translate-segment')
		const segment = await this.prisma.segment.findUnique({
			where: { id: segmentId },
			select: {
				id: true,
				title: true,
				theoryContent: true,
				module: {
					select: {
						ModuleVocabulary: { select: { word: true } },
						proficiencyLevel: {
							select: { code: true, title: true, description: true },
						},
					},
				},
			},
		})
		if (!segment) throw new NotFoundException(`Segment ${segmentId} not found`)
		const protectedTermsStr = formatProtectedTerms(
			buildProtectedTerms(
				segment.module.ModuleVocabulary.map(v => v.word),
				[],
				this.ctxConfig.protectedTermsExtra,
			),
		)
		const languageMap: Record<NATIVE_LANGUAGE, string> = {
			[NATIVE_LANGUAGE.KAZAKH]: 'Kazakh',
			[NATIVE_LANGUAGE.RUSSIAN]: 'Russian',
			[NATIVE_LANGUAGE.ENGLISH]: 'English',
		}
		let user = tpl.user
		user = user.replace(/{{title}}/g, segment.title)
		user = user.replace(/{{theoryContent}}/g, segment.theoryContent)
		user = user.replace(/{{targetLanguage}}/g, languageMap[targetLanguage])
		user = applyOptional(user, 'doNotTranslateTerms', protectedTermsStr)
		user = applyOptional(user, 'levelCode', segment.module.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', segment.module.proficiencyLevel.title)
		user = applyOptional(user, 'levelDescription', segment.module.proficiencyLevel.description)
		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	async buildTranslateInterestSegmentTemplate(
		interestSegmentId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<BuiltPrompt> {
		const tpl = this.registry.get('translate-interest-segment')
		const interestSegment = await this.prisma.interestSegment.findUnique({
			where: { id: interestSegmentId },
			select: {
				theoryContent: true,
				interest: true,
				segment: {
					select: {
						module: {
							select: {
								ModuleVocabulary: { select: { word: true } },
								proficiencyLevel: {
									select: { code: true, title: true, description: true },
								},
							},
						},
					},
				},
			},
		})
		if (!interestSegment)
			throw new NotFoundException(`InterestSegment ${interestSegmentId} not found`)
		const protectedTermsStr = formatProtectedTerms(
			buildProtectedTerms(
				interestSegment.segment.module.ModuleVocabulary.map(v => v.word),
				[],
				this.ctxConfig.protectedTermsExtra,
			),
		)
		const languageMap: Record<NATIVE_LANGUAGE, string> = {
			[NATIVE_LANGUAGE.KAZAKH]: 'Kazakh',
			[NATIVE_LANGUAGE.RUSSIAN]: 'Russian',
			[NATIVE_LANGUAGE.ENGLISH]: 'English',
		}
		let user = tpl.user
		user = user.replace(/{{theoryContent}}/g, interestSegment.theoryContent)
		user = user.replace(/{{interest}}/g, interestSegment.interest)
		user = user.replace(/{{targetLanguage}}/g, languageMap[targetLanguage])
		user = applyOptional(user, 'doNotTranslateTerms', protectedTermsStr)
		user = applyOptional(user, 'levelCode', interestSegment.segment.module.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', interestSegment.segment.module.proficiencyLevel.title)
		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	async buildTranslateExerciseTemplate(
		exerciseId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<BuiltPrompt> {
		const tpl = this.registry.get('translate-exercise')
		const exercise = await this.prisma.exercise.findUnique({
			where: { id: exerciseId },
			select: {
				id: true,
				title: true,
				type: true,
				payload: true,
				interestSegment: {
					select: {
						segment: {
							select: {
								module: {
									select: {
										ModuleVocabulary: { select: { word: true } },
										proficiencyLevel: {
											select: { code: true, title: true, description: true },
										},
									},
								},
							},
						},
					},
				},
			},
		})
		if (!exercise) throw new NotFoundException(`Exercise ${exerciseId} not found`)
		const protectedTermsStr = formatProtectedTerms(
			buildProtectedTerms(
				exercise.interestSegment.segment.module.ModuleVocabulary.map(v => v.word),
				[],
				this.ctxConfig.protectedTermsExtra,
			),
		)
		const languageMap: Record<NATIVE_LANGUAGE, string> = {
			[NATIVE_LANGUAGE.KAZAKH]: 'Kazakh',
			[NATIVE_LANGUAGE.RUSSIAN]: 'Russian',
			[NATIVE_LANGUAGE.ENGLISH]: 'English',
		}
		let user = tpl.user
		user = user.replace(/{{title}}/g, exercise.title)
		user = user.replace(/{{exerciseType}}/g, exercise.type)
		user = user.replace(/{{payload}}/g, JSON.stringify(exercise.payload, null, 2))
		user = user.replace(/{{targetLanguage}}/g, languageMap[targetLanguage])
		user = applyOptional(user, 'doNotTranslateTerms', protectedTermsStr)
		user = applyOptional(
			user,
			'levelCode',
			exercise.interestSegment.segment.module.proficiencyLevel.code,
		)
		user = applyOptional(
			user,
			'levelTitle',
			exercise.interestSegment.segment.module.proficiencyLevel.title,
		)
		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	/** Build for translating assessment questions with answers */
	async buildTranslateAssessmentQuestionTemplate(
		questionId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<BuiltPrompt> {
		const tpl = this.registry.get('translate-assessment-question')
		const question = await this.prisma.assessmentQuestion.findUnique({
			where: { id: questionId },
			include: { answers: true, proficiencyLevel: true },
		})
		if (!question) throw new NotFoundException(`AssessmentQuestion ${questionId} not found`)
		const languageMap = {
			[NATIVE_LANGUAGE.KAZAKH]: 'Kazakh',
			[NATIVE_LANGUAGE.RUSSIAN]: 'Russian',
			[NATIVE_LANGUAGE.ENGLISH]: 'English',
		}
		const answersJson = JSON.stringify(
			question.answers.map(a => ({ id: a.id, answer: a.answer, isCorrect: a.isCorrect })),
			null,
			2,
		)
		let user = tpl.user
		user = user.replace(/{{questionId}}/g, String(questionId))
		user = user.replace(/{{question}}/g, question.question)
		user = user.replace(/{{answers}}/g, answersJson)
		user = user.replace(/{{targetLanguage}}/g, languageMap[targetLanguage])
		user = applyOptional(user, 'levelCode', question.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', question.proficiencyLevel.title)
		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}

	public getStylePrompt(type: EXERCISE_TYPE, index: number): string {
		if (type === EXERCISE_TYPE.PICTURE_DESCRIPTION) {
			return this.registry.getImageStyle(index)
		}
		// all audio‐based types use audio style
		return this.registry.getAudioStyle(index)
	}

	async buildTranslateModuleVocabularyTemplate(
		vocabularyId: number,
		targetLanguage: NATIVE_LANGUAGE,
	): Promise<BuiltPrompt> {
		const tpl = this.registry.get('translate-module-vocabulary')
		const vocabulary = await this.prisma.moduleVocabulary.findUnique({
			where: { id: vocabularyId },
			include: {
				translations: true,
				module: {
					select: {
						ModuleVocabulary: { select: { word: true } },
						proficiencyLevel: {
							select: { code: true, title: true, description: true },
						},
					},
				},
			},
		})
		if (!vocabulary) throw new NotFoundException(`ModuleVocabulary ${vocabularyId} not found`)
		const protectedTermsStr = formatProtectedTerms(
			buildProtectedTerms(
				vocabulary.module.ModuleVocabulary.map(v => v.word),
				[],
				this.ctxConfig.protectedTermsExtra,
			),
		)
		const languageMap: Record<NATIVE_LANGUAGE, string> = {
			[NATIVE_LANGUAGE.KAZAKH]: 'Kazakh',
			[NATIVE_LANGUAGE.RUSSIAN]: 'Russian',
			[NATIVE_LANGUAGE.ENGLISH]: 'English',
		}
		const translationsJson = JSON.stringify(
			vocabulary.translations.map(t => ({
				language: t.language,
				translation: t.translation,
				description: t.description,
			})),
			null,
			2,
		)
		let user = tpl.user
		user = user.replace(/{{word}}/g, vocabulary.word)
		user = user.replace(/{{example}}/g, vocabulary.example ?? '')
		user = user.replace(/{{translations}}/g, translationsJson)
		user = user.replace(/{{targetLanguage}}/g, languageMap[targetLanguage])
		user = user.replace(/{{descriptions}}/g, '')
		user = applyOptional(user, 'doNotTranslateTerms', protectedTermsStr)
		user = applyOptional(user, 'levelCode', vocabulary.module.proficiencyLevel.code)
		user = applyOptional(user, 'levelTitle', vocabulary.module.proficiencyLevel.title)
		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}
}
