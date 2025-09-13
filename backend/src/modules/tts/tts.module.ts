import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { TtsController } from './tts.controller'
import { TtsService } from './tts.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { S3Module } from 'src/common/s3/s3.module'
import { AuthModule } from 'src/modules/auth/auth.module'
import { CommonModule } from 'src/common/common.module'

@Module({
	imports: [HttpModule, AppConfigModule, S3Module, CommonModule, AuthModule],
	controllers: [TtsController],
	providers: [TtsService],
	exports: [TtsService],
})
export class TtsModule {}
