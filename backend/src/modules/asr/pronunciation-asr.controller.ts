import {
	Controller,
	Post,
	Body,
	Param,
	UploadedFile,
	UseInterceptors,
	BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UseGuards } from '@nestjs/common'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { PronunciationASRService, AsrResult } from './pronunciation-asr.service'
import { S3Service } from 'src/common/s3/s3.service'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ExerciseAttempt } from '../chat/schemas/exercise-attempt.schema'
import { ExerciseAttemptDocument } from '../chat/services/learner-progress.service'

@Controller('asr')
@UseGuards(LearnerAuthGuard)
export class PronunciationASRController {
	constructor(
		private readonly asrService: PronunciationASRService,
		private readonly s3: S3Service,
		@InjectModel(ExerciseAttempt.name)
		private readonly attemptModel: Model<ExerciseAttemptDocument>,
	) {}

	/**
	 * Unified ASR endpoint.
	 * POST /asr (multipart/form-data)
	 * form fields: audio=<file>, language?=kk, attemptId?, learnerId?, exerciseId?, attemptNumber?
	 * If attemptId + meta provided, audio is saved to S3 and attempt is updated with asrResult.
	 */
	@Post()
	@UseInterceptors(FileInterceptor('audio'))
	async asr(
		@UploadedFile() file: Express.Multer.File,
		@Body()
		body: {
			language?: string
			attemptId?: string
			learnerId?: number
			exerciseId?: number
			attemptNumber?: number
		},
	): Promise<AsrResult & { audioKey?: string }> {
		if (!file) throw new BadRequestException('No audio file uploaded')
		const language = body.language || 'kk'

		// Run ASR first (fast path)
		const result: AsrResult = await this.asrService.transcribeBuffer(file.buffer, language)

		let savedKey: string | undefined
		// Optionally persist audio + result to attempt
		if (body.attemptId && body.learnerId && body.exerciseId && body.attemptNumber) {
			const ext = this.extFromMime(file.mimetype) || this.extFromName(file.originalname) || 'ogg'
			const filename = `pronunciation/${body.learnerId}/${body.exerciseId}/${body.attemptNumber}.${ext}`
			savedKey = await this.s3.uploadAudio(filename, file.buffer, file.mimetype || 'audio/ogg')
			await this.attemptModel.findByIdAndUpdate(body.attemptId, {
				$set: { audioKey: savedKey, asrResult: result },
			})
		}

		return { ...result, audioKey: savedKey }
	}

	private extFromMime(mime?: string): string | null {
		switch (mime) {
			case 'audio/ogg':
				return 'ogg'
			case 'audio/mpeg':
				return 'mp3'
			case 'audio/wav':
				return 'wav'
			case 'audio/webm':
				return 'webm'
			case 'audio/mp4':
			case 'audio/m4a':
				return 'm4a'
			default:
				return null
		}
	}

	private extFromName(name?: string): string | null {
		if (!name) return null
		const i = name.lastIndexOf('.')
		return i > -1 ? name.slice(i + 1).toLowerCase() : null
	}
	/**
	 * Upload pronunciation audio for an attempt. Stores in S3 and updates ExerciseAttempt.audioKey.
	 * POST /asr/upload/:attemptId (multipart/form-data, file=audio)
	 * Body: { learnerId, exerciseId, attemptNumber }
	 */
	@Post('upload/:attemptId')
	@UseInterceptors(FileInterceptor('audio'))
	async uploadAudio(
		@Param('attemptId') attemptId: string,
		@UploadedFile() file: Express.Multer.File,
		@Body() body: { learnerId: number; exerciseId: number; attemptNumber: number },
	): Promise<{ status: string; audioKey: string }> {
		if (!file) throw new BadRequestException('No audio file uploaded')
		const { learnerId, exerciseId, attemptNumber } = body
		const key = `pronunciation/${learnerId}/${exerciseId}/${attemptNumber}.ogg`
		await this.s3.uploadAudio(key, file.buffer, file.mimetype)
		await this.attemptModel.findByIdAndUpdate(attemptId, { $set: { audioKey: key } })
		return { status: 'ok', audioKey: key }
	}

	@Post('process/:attemptId')
	async processASR(
		@Param('attemptId') attemptId: string,
		@Body() body: { bucket: string; audioKey: string; language?: string },
	): Promise<{ status: string }> {
		await this.asrService.processAttemptASR(
			attemptId,
			body.bucket,
			body.audioKey,
			body.language || 'kk',
		)
		return { status: 'ok' }
	}
}
