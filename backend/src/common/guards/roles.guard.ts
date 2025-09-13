import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from 'src/prisma/prisma.service'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private prisma: PrismaService,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			ctx.getHandler(),
			ctx.getClass(),
		])
		if (!requiredRoles) return true

		const req = ctx.switchToHttp().getRequest<{ admin: { id: number } }>()
		const adminId = req.admin?.id
		if (!adminId) throw new ForbiddenException()

		const admin = await this.prisma.admin.findUnique({
			where: { id: adminId },
			select: { role: true },
		})
		if (!admin || !requiredRoles.includes(admin.role)) {
			throw new ForbiddenException('Forbidden')
		}

		return true
	}
}
