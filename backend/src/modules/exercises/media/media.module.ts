// src/modules/media/media.module.ts

import { Module } from '@nestjs/common'
import { AppConfigModule } from 'src/common/config/config.module'
import { AudioService } from './audio.service'
import { ImageService } from './image.service'
import { S3Module } from 'src/common/s3/s3.module'
import { TtsModule } from 'src/modules/tts/tts.module'

@Module({
	imports: [
		S3Module, // provides S3Service
		AppConfigModule, // provides AppConfigService
		TtsModule, // provides TtsService for AudioService
	],
	providers: [ImageService, AudioService],
	exports: [ImageService, AudioService],
})
export class MediaModule {}
