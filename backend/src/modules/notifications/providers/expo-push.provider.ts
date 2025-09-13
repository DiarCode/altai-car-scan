import { Injectable, Logger } from '@nestjs/common'
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

@Injectable()
export class ExpoPushProvider {
	private readonly logger = new Logger(ExpoPushProvider.name)
	private readonly expo = new Expo()

	async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
		const tickets: ExpoPushTicket[] = []
		const chunks = this.expo.chunkPushNotifications(messages)
		for (const chunk of chunks) {
			try {
				const t = await this.expo.sendPushNotificationsAsync(chunk)
				this.logger.debug(`Expo sent ${t.length} tickets`)
				tickets.push(...t)
			} catch (err) {
				this.logger.error('Expo push send error', err instanceof Error ? err.message : String(err))
			}
		}
		return tickets
	}
}
