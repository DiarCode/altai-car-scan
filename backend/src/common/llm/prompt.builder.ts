import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PromptRegistry } from './prompt.registry'
// import { EXERCISE_TYPE, INTEREST, NATIVE_LANGUAGE } from '@prisma/client'
// import {
// 	applyOptional,
// 	buildProtectedTerms,
// 	formatProtectedTerms,
// 	formatTruncationNotes,
// 	formatVocabularyList,
// 	listExistingExercises,
// 	TruncationNote,
// } from './prompt.utils'

export interface BuiltPrompt {
	messages: { role: 'system' | 'user'; content: string }[]
	maxTokens?: number
}

@Injectable()
export class PromptBuilderService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly registry: PromptRegistry,
	) {}

	/** Build for /segments/generate using 'theory-segments' template */
	// async buildGenerateTemplate(moduleId: number, count?: number): Promise<BuiltPrompt> {
	// 	const tpl = this.registry.get('theory-segments')

	// 	// fetch current module with level + vocab + order
	// 	const mod = await this.prisma.module.findUnique({
	// 		where: { id: moduleId },
	// 		select: {
	// 			id: true,
	// 			order: true,
	// 			title: true,
	// 			description: true,
	// 			outcomes: true,
	// 			theoryContent: true,
	// 			ModuleVocabulary: { select: { word: true } },
	// 			proficiencyLevel: { select: { id: true, code: true, title: true, description: true } },
	// 		},
	// 	})
	// 	if (!mod) throw new NotFoundException(`Module ${moduleId} not found`)

	// 	// previous modules by order within same level
	// 	const prevModules = await this.prisma.module.findMany({
	// 		where: {
	// 			proficiencyLevelId: mod.proficiencyLevel.id,
	// 			order: { lt: mod.order },
	// 		},
	// 		orderBy: { order: 'desc' },
	// 		take: this.ctxConfig.previousModulesLimit,
	// 		select: {
	// 			id: true,
	// 			order: true,
	// 			title: true,
	// 			ModuleVocabulary: { select: { word: true } },
	// 		},
	// 	})

	// 	const truncNotes: TruncationNote[] = []
	// 	const previousModulesStr = prevModules.length
	// 		? prevModules.map(m => `(${m.order}) ${m.title}`).join('\n')
	// 		: 'NONE (this is the first module for this level)'

	// 	const previousVocabAll = prevModules.flatMap(m => m.ModuleVocabulary.map(v => v.word))
	// 	const currentVocabAll = mod.ModuleVocabulary.map(v => v.word)
	// 	const previousVocabularyStr = formatVocabularyList(
	// 		previousVocabAll,
	// 		this.ctxConfig.previousVocabularyLimit,
	// 		truncNotes,
	// 		'previousVocabulary',
	// 	)
	// 	const currentVocabularyStr = formatVocabularyList(
	// 		currentVocabAll,
	// 		this.ctxConfig.currentVocabularyLimit,
	// 		truncNotes,
	// 		'currentVocabulary',
	// 	)
	// 	const protectedTerms = buildProtectedTerms(
	// 		currentVocabAll,
	// 		previousVocabAll,
	// 		this.ctxConfig.protectedTermsExtra,
	// 	)
	// 	const protectedTermsStr = formatProtectedTerms(protectedTerms)
	// 	const truncationNotes = formatTruncationNotes(truncNotes)

	// 	let user = tpl.user
	// 	user = user.replace(/{{count}}/g, String(count ?? 1))
	// 	user = user.replace(/{{proficiencyLevel}}/g, String(mod.proficiencyLevel.code))
	// 	user = user.replace(/{{moduleTitle}}/g, mod.title)
	// 	user = user.replace(/{{moduleDescription}}/g, mod.description)
	// 	user = user.replace(/{{outcomes}}/g, mod.outcomes)
	// 	user = user.replace(/{{theoryContent}}/g, mod.theoryContent)
	// 	user = user.replace(/{{vocabulary}}/g, currentVocabAll.join(', ')) // legacy
	// 	user = applyOptional(user, 'previousModules', previousModulesStr)
	// 	user = applyOptional(user, 'previousVocabulary', previousVocabularyStr)
	// 	user = applyOptional(user, 'currentVocabulary', currentVocabularyStr)
	// 	user = applyOptional(user, 'protectedTerms', protectedTermsStr)
	// 	user = applyOptional(user, 'truncationNotes', truncationNotes)
	// 	user = applyOptional(user, 'levelCode', mod.proficiencyLevel.code)
	// 	user = applyOptional(user, 'levelTitle', mod.proficiencyLevel.title)
	// 	user = applyOptional(user, 'levelDescription', mod.proficiencyLevel.description)

	// 	let system = tpl.system
	// 	system = applyOptional(system, 'levelCode', mod.proficiencyLevel.code)
	// 	system = applyOptional(system, 'levelTitle', mod.proficiencyLevel.title)

	// 	if (process.env.DEBUG_PROMPTS === 'true') {
	// 		console.log('[PromptBuilder] theory-segments length user=', user.length)
	// 	}

	// 	return {
	// 		messages: [
	// 			{ role: 'system', content: system.trim() },
	// 			{ role: 'user', content: user.trim() },
	// 		],
	// 		maxTokens: tpl.maxTokens,
	// 	}
	// }

	buildCarAnalysisPrompt(
		pipelineResult: any,
		carInfo: any,
		partners: any[],
		services: any[],
	): BuiltPrompt {
		const tpl = this.registry.get('car-analysis')

		let user = tpl.user
		user = user.replace(/{{carInfo}}/g, JSON.stringify(carInfo))
		user = user.replace(/{{partners}}/g, JSON.stringify(partners))
		user = user.replace(/{{services}}/g, JSON.stringify(services))
		user = user.replace(/{{pipelineResult}}/g, JSON.stringify(pipelineResult))

		return {
			messages: [
				{ role: 'system', content: tpl.system.trim() },
				{ role: 'user', content: user.trim() },
			],
			maxTokens: tpl.maxTokens,
		}
	}
}
