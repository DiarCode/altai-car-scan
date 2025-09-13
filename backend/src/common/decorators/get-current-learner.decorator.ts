// src/common/decorators/get-current-learner.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { LearnerRequest } from '../types/learner-request.interface'

/**
 * @GetCurrentLearner() → just the learner’s id number
 */
export const GetCurrentLearner = createParamDecorator((_, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest<LearnerRequest>()
	return req.learner
})
