import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FreeChat, FreeChatDocument } from '../schemas/free-chat.schema'

@Injectable()
export class FreeChatSessionService {
	constructor(
		@InjectModel(FreeChat.name)
		private readonly freeChatModel: Model<FreeChatDocument>,
	) {}

	async getFreeChatByLearnerId(learnerId: number): Promise<FreeChatDocument | null> {
		return this.freeChatModel.findOne({ learnerId }).exec()
	}

	async createFreeChat(learnerId: number): Promise<FreeChatDocument> {
		const newFreeChat = new this.freeChatModel({ learnerId })
		return newFreeChat.save()
	}
}
