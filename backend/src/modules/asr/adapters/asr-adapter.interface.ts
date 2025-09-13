// ASR Adapter interface for pronunciation validation
/**
 * Result returned by concrete ASR adapters (model-agnostic).
 * The adapter itself does not include `model` field; the service wraps adapter result and adds model.
 */
export interface AsrAdapterResult {
	transcript: string
	phonemes?: string
	confidence?: number
}

export interface PronunciationASRAdapter {
	readonly modelName: string
	transcribe(audioBuffer: Buffer, language: string): Promise<AsrAdapterResult>
}
