// src/modules/chat/services/chat-message.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, FilterQuery } from 'mongoose'
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema'
import { ChatMessageDto, ChatMessagesResponseDto, ChatMessagesQueryDto } from '../dtos/chat.dtos'
import { ChatMessageType, MessagePriority, MessageRole } from '../types/chat-flow.types'

@Injectable()
export class ChatMessageService {
	private readonly logger = new Logger(ChatMessageService.name)

	constructor(
		@InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
	) {}

	/**
	 * Create a new message (can be called from other services)
	 */
	async createMessage(data: Partial<ChatMessageDto>): Promise<ChatMessageDocument> {
		try {
			const message = new this.chatMessageModel({
				...data,
				isSystemMessage: data.isSystemMessage || false,
				priority: data.priority || MessagePriority.NORMAL,
			})

			await message.save()
			this.logger.debug(`Message created: ${String(message._id)}`)
			return message
		} catch (error) {
			this.logger.error('Error creating message:', error)
			throw error
		}
	}

	/**
	 * Get messages with pagination
	 */
	async getMessages(query: ChatMessagesQueryDto): Promise<ChatMessagesResponseDto> {
		const { sessionId, learnerId, moduleId, type, page = 1, pageSize = 5 } = query

		const skip = (page - 1) * pageSize
		const take = pageSize

		// Build MongoDB query
		const filter: FilterQuery<ChatMessageDocument> = {
			sessionId,
			learnerId,
			...(moduleId && { moduleId }),
			...(type && { type }),
		}

		const [messages, totalCount] = await Promise.all([
			this.chatMessageModel
				.find(filter)
				.sort({ createdAt: -1 }) // Sort by creation date descending for latest messages first
				.skip(skip)
				.limit(take)
				.exec(),
			this.chatMessageModel.countDocuments(filter).exec(),
		])

		// Messages are returned in descending order, so reverse them to be chronological
		messages.reverse()

		const hasMore = page * pageSize < totalCount

		return {
			messages: messages.map(message => this.mapMessageToDto(message)),
			hasMore,
			totalCount,
		}
	}

	/**
	 * Get conversation history for context
	 */
	private getMessageRole(type: ChatMessageType): MessageRole {
		switch (type) {
			case ChatMessageType.USER_QUESTION:
			case ChatMessageType.USER_ACTION:
			case ChatMessageType.USER_EXERCISE_ANSWER:
			case ChatMessageType.USER_VOCABULARY_REQUEST:
				return MessageRole.USER
			case ChatMessageType.AI_RESPONSE:
			case ChatMessageType.AI_VOCABULARY_EXPLANATION:
			case ChatMessageType.AI_MEMORIZATION_TIP:
				return MessageRole.ASSISTANT
			default:
				return MessageRole.SYSTEM
		}
	}

	/**
	 * Get conversation history for context
	 */
	async getConversationHistory(
		sessionId: string,
		learnerId: number,
		limit: number = 10,
	): Promise<
		Array<{
			role: MessageRole
			content: string
			timestamp: Date
		}>
	> {
		const messages = await this.chatMessageModel
			.find({
				sessionId,
				learnerId,
				type: { $in: [ChatMessageType.USER_QUESTION, ChatMessageType.AI_RESPONSE] },
			})
			.sort({ createdAt: -1 })
			.limit(limit)
			.exec()

		return messages.reverse().map(msg => ({
			role: this.getMessageRole(msg.type),
			content: msg.content,
			timestamp: msg.createdAt,
		}))
	}

	/**
	 * Search messages
	 */
	async searchMessages(
		sessionId: string,
		learnerId: number,
		searchTerm: string,
		limit: number = 10,
	): Promise<ChatMessageDocument[]> {
		return this.chatMessageModel
			.find({
				sessionId,
				learnerId,
				$text: { $search: searchTerm },
			})
			.sort({ createdAt: -1 })
			.limit(limit)
			.exec()
	}

	/**
	 * Delete message
	 */
	async deleteMessage(messageId: string): Promise<void> {
		const result = await this.chatMessageModel.deleteOne({ _id: messageId }).exec()
		if (result.deletedCount === 0) {
			throw new NotFoundException(`Message ${messageId} not found`)
		}
	}

	/**
	 * Update message content
	 */
	async updateMessage(
		messageId: string,
		updates: Partial<Pick<ChatMessage, 'content'>>,
	): Promise<ChatMessageDocument> {
		const message = await this.chatMessageModel
			.findByIdAndUpdate(messageId, updates, { new: true })
			.exec()

		if (!message) {
			throw new NotFoundException(`Message ${messageId} not found`)
		}

		return message
	}

	/**
	 * Get message statistics
	 */
	mapMessageToDto(message: ChatMessageDocument): ChatMessageDto {
		const messageDto = new ChatMessageDto()
		messageDto._id = String(message._id)
		messageDto.sessionId = message.sessionId
		messageDto.learnerId = message.learnerId
		messageDto.moduleId = message.moduleId
		messageDto.type = message.type
		messageDto.content = message.content
		messageDto.language = message.language
		messageDto.priority = message.priority
		messageDto.contentReference = message.contentReference
		messageDto.exerciseReference = message.exerciseReference
		messageDto.userAnswer = message.userAnswer
		messageDto.commandData = message.commandData
		messageDto.aiMetadata = message.aiMetadata
		messageDto.isSystemMessage = message.isSystemMessage
		messageDto.createdAt = message.createdAt
		messageDto.updatedAt = message.updatedAt
		return messageDto
	}

	async getMessageStats(
		sessionId: string,
		learnerId: number,
	): Promise<{
		totalMessages: number
		userMessages: number
		aiMessages: number
		systemMessages: number
		averageWordsPerMessage: number
		mostUsedCommands: Array<{ command: string; count: number }>
	}> {
		const pipeline = [
			{ $match: { sessionId, learnerId, isHidden: false } },
			{
				$group: {
					_id: null,
					totalMessages: { $sum: 1 },
					userMessages: {
						$sum: { $cond: [{ $eq: ['$type', ChatMessageType.USER_QUESTION] }, 1, 0] },
					},
					aiMessages: {
						$sum: { $cond: [{ $eq: ['$type', ChatMessageType.AI_RESPONSE] }, 1, 0] },
					},
					systemMessages: {
						$sum: { $cond: ['$isSystemMessage', 1, 0] },
					},
					totalWords: {
						$sum: {
							$size: {
								$split: ['$content', ' '],
							},
						},
					},
				},
			},
		]

		const [stats] = await this.chatMessageModel
			.aggregate<{
				totalMessages: number
				userMessages: number
				aiMessages: number
				systemMessages: number
				totalWords: number
			}>(pipeline)
			.exec()

		// Get most used commands
		const commandStats = await this.chatMessageModel
			.aggregate([
				{ $match: { sessionId, learnerId, type: ChatMessageType.USER_ACTION } },
				{ $group: { _id: '$commandData.command', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: 5 },
			])
			.exec()

		return {
			totalMessages: stats?.totalMessages || 0,
			userMessages: stats?.userMessages || 0,
			aiMessages: stats?.aiMessages || 0,
			systemMessages: stats?.systemMessages || 0,
			averageWordsPerMessage: stats?.totalMessages
				? (stats.totalWords || 0) / stats.totalMessages
				: 0,
			mostUsedCommands: commandStats.map((cmd: { _id: string; count: number }) => ({
				command: cmd._id,
				count: cmd.count,
			})),
		}
	}
}
