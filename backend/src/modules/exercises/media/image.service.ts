// src/modules/exercises/media/image.service.ts

import { Injectable } from '@nestjs/common'
import { S3Service } from 'src/common/s3/s3.service'
import { AppConfigService } from 'src/common/config/config.service'
import sharp from 'sharp'
import { Buffer } from 'buffer'

@Injectable()
export class ImageService {
	private readonly imagePrefix: string

	constructor(
		private readonly s3: S3Service,
		private readonly config: AppConfigService,
	) {
		// keep using whatever prefix you configured
		this.imagePrefix = this.config.s3.imagePrefix
	}

	/** Convert → WebP then upload under images/ */
	async uploadImage(key: string, buffer: Buffer): Promise<string> {
		const filename = `${key}.webp`
		const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer()
		return this.s3.uploadImage(filename, webpBuffer, 'image/webp')
	}

	/** Delete images/<key>.webp */
	async deleteImage(key: string): Promise<void> {
		const filename = `${key}.webp`
		await this.s3.delete(`${this.imagePrefix}/${filename}`)
	}
}
