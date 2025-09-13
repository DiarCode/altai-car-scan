import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'

import { CommonModule } from 'src/common/common.module'
import { AuthModule } from 'src/modules/auth/auth.module'
import { AppConfigModule } from 'src/common/config/config.module' // <—

import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { AdminOtpService } from './services/admin-otp.service'
import { AdminProfileService } from './services/admin-profile.service'
import { AdminAuthController } from './admin-auth.controller'

@Module({
	imports: [
		CommonModule, // JwtService, CookieService
		AuthModule, // AdminSessionService & guards
		AppConfigModule, // <— provides AppConfigService
		HttpModule, // HttpService for adapter
		ScheduleModule.forRoot(),
	],
	controllers: [AdminAuthController],
	providers: [WhatsAppAdapter, AdminOtpService, AdminProfileService],
})
export class AdminAuthModule {}
