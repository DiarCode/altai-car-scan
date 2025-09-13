// src/modules/vocabulary/adapters/vocabulary-explanation.adapter.ts

/**
 * Abstraction for any explanation provider.
 */
import { NATIVE_LANGUAGE } from '@prisma/client'

export interface VocabularyExplanationAdapter {
	/**
	 * Generate a human-readable explanation for a given word.
	 */
	explain(word: string, language: NATIVE_LANGUAGE, description: string): Promise<string>
}
