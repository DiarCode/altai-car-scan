import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FreeChatMessage, FreeChatMessageDocument } from '../schemas/free-chat.schema'
import {
	FreeChatMessageDto,
	FreeChatMessagesQuery,
	FreeChatMessagesResponseDto,
} from '../dtos/free-chat.dtos'

@Injectable()
export class FreeChatMessageService {
	constructor(
		@InjectModel(FreeChatMessage.name)
		private readonly freeChatMessageModel: Model<FreeChatMessageDocument>,
	) {}

	async createFreeChatMessage(
		messageData: Partial<FreeChatMessage>,
	): Promise<FreeChatMessageDocument> {
		const newMessage = new this.freeChatMessageModel(messageData)
		return newMessage.save()
	}

	async getFreeChatMessages(
		freeChatId: string,
		query: FreeChatMessagesQuery,
	): Promise<FreeChatMessagesResponseDto> {
		const page = query.page
		const pageSize = query.pageSize
		const skip = (page - 1) * pageSize

		const messages = await this.freeChatMessageModel
			.find({ freeChatId, isArchived: false })
			.sort({ createdAt: 1 })
			.skip(skip)
			.limit(pageSize)
			.exec()

		const totalCount = await this.freeChatMessageModel.countDocuments({
			freeChatId,
			isArchived: false,
		})
		const hasMore = totalCount > skip + pageSize
		return {
			messages: messages.map(message => this.mapMessageToDto(message)),
			hasMore,
			totalCount,
		}
	}

	mapMessageToDto(message: FreeChatMessageDocument): FreeChatMessageDto {
		return {
			id: String(message._id),
			freeChatId: message.freeChatId,
			content: message.content,
			role: message.role,
			createdAt: message.createdAt,
			isArchived: message.isArchived,
		}
	}

	async archiveOldMessages(cutoffDate: Date) {
		return this.freeChatMessageModel
			.updateMany(
				{
					createdAt: { $lt: cutoffDate },
					isArchived: false,
				},
				{ $set: { isArchived: true } },
			)
			.exec()
	}

	async getLastFiveMessages(freeChatId: string): Promise<FreeChatMessageDto[]> {
		const messages = await this.freeChatMessageModel
			.find({ freeChatId, isArchived: false })
			.sort({ createdAt: -1 })
			.limit(5)
			.exec()

		return messages.map(message => this.mapMessageToDto(message))
	}
}
