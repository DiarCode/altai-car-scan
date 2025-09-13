import { Injectable } from '@nestjs/common'
import { ExerciseValidationService } from './exercise-validation.service'
import { ExerciseValidationResult, ExerciseAnswer } from 'src/modules/chat/types/chat-flow.types'
import { NATIVE_LANGUAGE } from '@prisma/client'

export type ValidationMode = 'chat' | 'daily'

export interface ValidationDescriptor {
	result: ExerciseValidationResult
	chat?: {
		assistantMessage?: string
		assistantImageUrl?: string
	}
	daily?: {
		// future flags (e.g., skipAttemptRecording)
		skipAttemptRecording?: boolean
	}
}

@Injectable()
export class ExerciseValidationFacadeService {
	constructor(private readonly core: ExerciseValidationService) {}

	async validate(
		mode: ValidationMode,
		exerciseId: number,
		answer: ExerciseAnswer,
		isDontKnow: boolean,
		language: NATIVE_LANGUAGE,
		contextExtras: Record<string, any>,
	): Promise<ValidationDescriptor> {
		// For now, facade calls core validator and returns a descriptor wrapper.
		const result = await this.core.validateAnswer(
			exerciseId,
			answer,
			isDontKnow,
			language,
			contextExtras,
		)

		const descriptor: ValidationDescriptor = { result }

		// Simple mode-specific augmentation points
		if (mode === 'chat') {
			// chat consumers may want an assistant message; leave undefined to allow existing feedback generation
			descriptor.chat = {}
		} else if (mode === 'daily') {
			descriptor.daily = { skipAttemptRecording: false }
		}

		return descriptor
	}
}
