import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { S3Service } from 'src/common/s3/s3.service'
import { PronunciationASRService } from './pronunciation-asr.service'
import { PronunciationASRController } from './pronunciation-asr.controller'
import { FasterWhisperASRAdapter } from './adapters/faster-whisper-asr.adapter'
import { AppConfigModule } from 'src/common/config/config.module'
import { AuthModule } from 'src/modules/auth/auth.module'
import { CommonModule } from 'src/common/common.module'
import { ExerciseAttempt, ExerciseAttemptSchema } from '../chat/schemas/exercise-attempt.schema'
@Module({
	imports: [
		MongooseModule.forFeature([{ name: ExerciseAttempt.name, schema: ExerciseAttemptSchema }]),
		AppConfigModule,
		CommonModule,
		AuthModule,
	],
	controllers: [PronunciationASRController],
	providers: [
		S3Service,
		{
			provide: 'PronunciationASRAdapter',
			useClass: FasterWhisperASRAdapter,
		},
		PronunciationASRService,
	],
	exports: [PronunciationASRService],
})
export class ASRModule {}
