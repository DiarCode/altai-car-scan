export interface FreeChatLLMAdapter {
	generateResponse(
		prompt: string,
		context: unknown,
	): Promise<{ content: string; metadata: unknown }>
}
