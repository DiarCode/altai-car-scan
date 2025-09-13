// src/modules/auth/learner/utils/learner.mapper.ts

import { Learner as PrismaLearner, ProficiencyLevel } from '@prisma/client'
import { LearnerDto } from '../dtos/learner-auth.dtos'

type LearnerWithAssignedLevel = PrismaLearner & { assignedLevel: ProficiencyLevel }

export function toLearnerDto(raw: LearnerWithAssignedLevel): LearnerDto {
	return {
		id: raw.id,
		name: raw.name,
		phoneNumber: raw.phoneNumber,
		nativeLanguage: raw.nativeLanguage,
		interests: raw.interests ?? [],
		verified: raw.verified,
		assignedLevelId: raw.assignedLevelId,
		assignedLevelCode: raw.assignedLevel.code,
		dailyTimeGoal: raw.dailyTimeGoal,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
	}
}
