import { Module } from '@nestjs/common'
import { LearnerOtpService } from './services/learner-otp.service'
import { LearnerSessionService } from './services/learner-session.service'
import { LearnerProfileService } from './services/learner-profile.service'
import { LearnerAuthController } from './learner-auth.controller'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'
import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { ScheduleModule } from '@nestjs/schedule'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from 'src/common/common.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { AuthModule } from '../auth.module'
import { NotificationsModule } from 'src/modules/notifications/notifications.module'
import { NotificationsApi } from 'src/modules/notifications/notifications.service'

@Module({
	imports: [
		CommonModule, // JwtService, CookieService
		AuthModule, // AdminSessionService & guards
		AppConfigModule, // <— provides AppConfigService
		HttpModule, // HttpService for adapter
		ScheduleModule.forRoot(),
		NotificationsModule,
	],
	providers: [
		WhatsAppAdapter,
		LearnerOtpService,
		LearnerSessionService,
		LearnerProfileService,
		LearnerAuthGuard,
		NotificationsApi,
	],
	controllers: [LearnerAuthController],
})
export class LearnerAuthModule {}
