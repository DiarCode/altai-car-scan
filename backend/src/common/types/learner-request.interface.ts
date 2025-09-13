// src/common/types/learner-request.interface.ts

import { NATIVE_LANGUAGE } from '@prisma/client'
import { Request } from 'express'

export interface LearnerClaims {
	id: number
	nativeLanguage: NATIVE_LANGUAGE
}

export interface LearnerRequest extends Request {
	learner: LearnerClaims
}
