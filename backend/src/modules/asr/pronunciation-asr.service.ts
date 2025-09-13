import { Inject, Injectable, Logger } from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { S3Service } from 'src/common/s3/s3.service'
import { PronunciationASRAdapter, AsrAdapterResult } from './adapters/asr-adapter.interface'
import { ExerciseAttempt } from '../chat/schemas/exercise-attempt.schema'
import { ExerciseAttemptDocument } from '../chat/services/learner-progress.service'

/** Strongly-typed ASR result including the adapter model name. */
export type AsrResult = {
	transcript: string
	phonemes?: string
	confidence?: number
	model: string
}

@Injectable()
export class PronunciationASRService {
	private readonly logger = new Logger(PronunciationASRService.name)

	constructor(
		@InjectModel(ExerciseAttempt.name)
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
		private readonly s3: S3Service,
		@Inject('PronunciationASRAdapter') private readonly asrAdapter: PronunciationASRAdapter, // Inject desired adapter
	) {}

	/**
	 * Process pronunciation attempt: download audio from S3, run ASR, update attempt with result
	 */
	async processAttemptASR(
		attemptId: string,
		bucket: string,
		audioKey: string,
		language: string = 'kk',
	): Promise<void> {
		this.logger.log(`Processing ASR for attempt ${attemptId} (key: ${audioKey})`)
		const audioBuffer = await this.s3.getObjectBuffer(bucket, audioKey)
		const asrResult = await this.asrAdapter.transcribe(audioBuffer, language)
		const result: AsrResult = { ...asrResult, model: this.asrAdapter.modelName }
		await this.attemptModel.findByIdAndUpdate(attemptId, {
			$set: { asrResult: result },
		})
		this.logger.log(`ASR result saved for attempt ${attemptId}`)
	}

	/** Transcribe a raw audio buffer and return normalized shape including model name. */
	async transcribeBuffer(audioBuffer: Buffer, language: string): Promise<AsrResult> {
		const asr: AsrAdapterResult = await this.asrAdapter.transcribe(audioBuffer, language)
		return { ...asr, model: this.asrAdapter.modelName }
	}
}
