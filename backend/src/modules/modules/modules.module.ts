import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ModulesController } from './modules.controller'
import { ModulesService } from './modules.service'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'

@Module({
	imports: [PrismaModule, AuthModule, CommonModule],
	controllers: [ModulesController],
	providers: [ModulesService],
})
export class ModulesModule {}
