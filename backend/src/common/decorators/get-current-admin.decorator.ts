import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AdminRequest } from '../types/admin-request.interface'

/**
 * @GetCurrentAdmin()     → just the id number
 */
export const GetCurrentAdmin = createParamDecorator<undefined, number | undefined>(
	(_, ctx: ExecutionContext) => {
		const req = ctx.switchToHttp().getRequest<AdminRequest>()
		return req.admin?.id
	},
)
