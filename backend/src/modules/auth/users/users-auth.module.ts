import { Module } from '@nestjs/common'
import { UsersOtpService } from './services/users-otp.service'
import { UsersSessionService } from './services/users-session.service'
import { UsersProfileService } from './services/users-profile.service'
import { UsersAuthController } from './users-auth.controller'
import { UsersAuthGuard } from 'src/common/guards/users-auth.guard'
import { WhatsAppAdapter } from 'src/common/adapters/whatsapp-built-in.adapter'
import { ScheduleModule } from '@nestjs/schedule'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from 'src/common/common.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { AuthModule } from '../auth.module'

@Module({
	imports: [
		CommonModule, // JwtService, CookieService
		AuthModule, // AdminSessionService & guards
		AppConfigModule, // <— provides AppConfigService
		HttpModule, // HttpService for adapter
		ScheduleModule.forRoot(),
	],
	providers: [
		WhatsAppAdapter,
		UsersOtpService,
		UsersSessionService,
		UsersProfileService,
		UsersAuthGuard,
	],
	controllers: [UsersAuthController],
})
export class UsersAuthModule {}
