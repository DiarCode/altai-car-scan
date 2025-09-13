// src/modules/chat/services/chat-flow-state.machine.ts

import { Injectable, BadRequestException } from '@nestjs/common'
import { ChatFlowState, ChatActionType, ChatFlowContext } from '../types/chat-flow.types'
import { log } from 'console'

interface StateTransition {
	from: ChatFlowState[]
	to: ChatFlowState
	action: ChatActionType
	validate?: (context: ChatFlowContext) => boolean
}

@Injectable()
export class ChatFlowStateService {
	private readonly transitions: StateTransition[] = [
		{
			from: [ChatFlowState.MODULE_WELCOME],
			to: ChatFlowState.MODULE_WELCOME,
			action: ChatActionType.BEGIN_MODULE,
		},
		{
			from: [ChatFlowState.MODULE_WELCOME],
			to: ChatFlowState.SEGMENT_CONTENT,
			action: ChatActionType.NEXT_SEGMENT,
		},
		{
			from: [ChatFlowState.SEGMENT_CONTENT],
			to: ChatFlowState.EXERCISE,
			action: ChatActionType.START_EXERCISE,
		},
		{
			from: [ChatFlowState.EXERCISE],
			to: ChatFlowState.SEGMENT_CONTENT,
			action: ChatActionType.SUBMIT_ANSWER,
		},
		{
			from: [ChatFlowState.SEGMENT_CONTENT],
			to: ChatFlowState.SEGMENT_CONTENT,
			action: ChatActionType.NEXT_SEGMENT,
		},
		{
			from: [ChatFlowState.SEGMENT_CONTENT],
			to: ChatFlowState.MODULE_COMPLETE,
			action: ChatActionType.NEXT_SEGMENT,
			validate: ctx => ctx.progress.completedSegmentIds.length === ctx.progress.segmentIds.length,
		},
	]

	canTransition(
		currentState: ChatFlowState,
		action: ChatActionType,
		context: ChatFlowContext,
	): boolean {
		const transition = this.findTransition(currentState, action)
		if (!transition) return false

		if (transition.validate) {
			return transition.validate(context)
		}

		return true
	}

	transition(
		currentState: ChatFlowState,
		action: ChatActionType,
		context: ChatFlowContext,
	): ChatFlowState {
		const transition = this.findTransition(currentState, action)

		if (!transition) {
			throw new BadRequestException(`Invalid transition: ${currentState} -> ${action}`)
		}

		if (transition.validate && !transition.validate(context)) {
			throw new BadRequestException(`Transition validation failed: ${currentState} -> ${action}`)
		}

		return transition.to
	}

	private findTransition(
		currentState: ChatFlowState,
		action: ChatActionType,
	): StateTransition | undefined {
		return this.transitions.find(t => t.from.includes(currentState) && t.action === action)
	}

	getAllowedActions(currentState: ChatFlowState, context: ChatFlowContext): ChatActionType[] {
		return this.transitions
			.filter(t => t.from.includes(currentState))
			.filter(t => !t.validate || t.validate(context))
			.map(t => t.action)
	}

	isTerminalState(state: ChatFlowState): boolean {
		return state === ChatFlowState.MODULE_COMPLETE
	}

	canAskQuestion(state: ChatFlowState): boolean {
		log(`Checking if state ${state} allows asking questions`)
		return true
	}
}
