export interface TextGeneratorPrompt {
	moduleTitle: string
	moduleTheory: string
	count: number
}

export interface GeneratedSegment {
	title: string
	theoryContent: string
	order: number
	timeToComplete: number
}

export interface ITextGenerator {
	/**
	 * Given a prompt, generate `count` segments for a module.
	 */
	generateSegments(prompt: TextGeneratorPrompt): Promise<GeneratedSegment[]>
}
