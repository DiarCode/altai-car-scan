import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/prisma/prisma.module'
import { ProficiencyLevelsController } from './proficiency-levels.controller'
import { ProficiencyLevelsService } from './proficiency-levels.service'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from 'src/common/common.module'

@Module({
	imports: [PrismaModule, AuthModule, CommonModule],
	controllers: [ProficiencyLevelsController],
	providers: [ProficiencyLevelsService],
})
export class ProficiencyLevelsModule {}
