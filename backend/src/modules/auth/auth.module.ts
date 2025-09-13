import { Module } from '@nestjs/common'
import { CommonModule } from 'src/common/common.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { AdminAuthGuard } from 'src/common/guards/admin-auth.guard'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { AdminSessionService } from './admin/services/admin-session.service'
import { AppConfigModule } from 'src/common/config/config.module'
import { LearnerSessionService } from './learner/services/learner-session.service'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'

@Module({
	imports: [PrismaModule, CommonModule, AppConfigModule],
	providers: [
		AdminSessionService,
		AdminAuthGuard,
		RolesGuard,
		LearnerSessionService,
		LearnerAuthGuard,
	],
	exports: [
		AdminSessionService,
		AdminAuthGuard,
		RolesGuard,
		LearnerSessionService,
		LearnerAuthGuard,
	],
})
export class AuthModule {}
