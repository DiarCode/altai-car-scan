import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { AssessmentController } from './assessment.controller'
import { AssessmentService } from './assessment.service'
import { PrismaModule } from 'src/prisma/prisma.module'
import { CommonModule } from 'src/common/common.module'
import { AppConfigModule } from 'src/common/config/config.module'
import { AuthModule } from '../auth/auth.module'
import { S3Module } from 'src/common/s3/s3.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { NotificationsApi } from '../notifications/notifications.service'

@Module({
	imports: [AppConfigModule, PrismaModule, CommonModule, S3Module, AuthModule, NotificationsModule],
	controllers: [AssessmentController],
	providers: [AssessmentService, PrismaService, NotificationsApi],
	exports: [AssessmentService],
})
export class AssessmentModule {}
