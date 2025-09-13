import { Module } from '@nestjs/common'
import { CommonModule } from 'src/common/common.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { UsersSessionService } from './services/users-session.service'
import { UsersAuthGuard } from 'src/common/guards/users-auth.guard'

@Module({
	imports: [PrismaModule, CommonModule, AppConfigModule],
	providers: [UsersSessionService, UsersAuthGuard],
	exports: [UsersSessionService, UsersAuthGuard],
})
export class AuthModule {}
