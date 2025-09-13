import { Injectable } from '@nestjs/common'

export interface PromptContextConfig {
	previousModulesLimit: number
	previousVocabularyLimit: number
	currentVocabularyLimit: number
	existingExercisesLimitSameType: number
	existingExercisesLimitAll: number
	exercisePayloadSummaryChars: number
	protectedTermsExtra: string[]
}

@Injectable()
export class PromptContextConfigService implements PromptContextConfig {
	previousModulesLimit = parseInt(process.env.PROMPT_PREV_MODULES_LIMIT || '1')
	previousVocabularyLimit = parseInt(process.env.PROMPT_PREV_VOCAB_LIMIT || '120')
	currentVocabularyLimit = parseInt(process.env.PROMPT_CURR_VOCAB_LIMIT || '120')
	existingExercisesLimitSameType = parseInt(process.env.PROMPT_EXIST_EX_SAME_LIMIT || '3')
	existingExercisesLimitAll = parseInt(process.env.PROMPT_EXIST_EX_ALL_LIMIT || '15')
	exercisePayloadSummaryChars = parseInt(process.env.PROMPT_EX_PAYLOAD_CHARS || '1000')
	protectedTermsExtra = (process.env.PROMPT_PROTECTED_TERMS || '')
		.split(',')
		.map(s => s.trim())
		.filter(Boolean)
}
