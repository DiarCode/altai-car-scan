import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DevtoolsModule } from '@nestjs/devtools-integration'
import { LoggerModule } from 'nestjs-pino'

import { AppConfigModule } from './common/config/config.module'
import { UsersAuthModule } from './modules/auth/users/users-auth.module'
import { PrismaModule } from './prisma/prisma.module'

import { SecurityMiddleware } from './common/middleware/security.middleware'

import { ScheduleModule } from '@nestjs/schedule'
import { BossModule } from './common/queue/boss.module'

@Module({
	imports: [
		// Dev / logging
		DevtoolsModule.register({ http: process.env.NODE_ENV !== 'production' }),
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
				transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
			},
		}),

		// Global config & DB
		ConfigModule.forRoot({ isGlobal: true }),
		AppConfigModule,
		ScheduleModule.forRoot(),
		BossModule,
		PrismaModule,
		// authentication
		UsersAuthModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SecurityMiddleware).forRoutes('*')
	}
}
