import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { AdminManagementService } from './admin-management.service'
import { AdminManagementController } from './admin-management-controller'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'

@Module({
	imports: [PrismaModule, AuthModule, CommonModule],
	controllers: [AdminManagementController],
	providers: [AdminManagementService],
})
export class AdminManagementModule {}
