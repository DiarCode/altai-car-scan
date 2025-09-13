import { BadRequestException } from '@nestjs/common'

export function validateImage(file: Express.Multer.File): void {
	if (!file.mimetype.startsWith('image/')) {
		throw new BadRequestException(`Invalid image file type: ${file.mimetype}`)
	}
	const allowedExt = ['.jpg', '.jpeg', '.png', '.webp']
	if (!allowedExt.some(ext => file.originalname.endsWith(ext))) {
		throw new BadRequestException(`Unsupported image extension: ${file.originalname}`)
	}
}

export function validateAudio(file: Express.Multer.File): void {
	if (!file.mimetype.startsWith('audio/')) {
		throw new BadRequestException(`Invalid audio file type: ${file.mimetype}`)
	}
	const allowedExt = ['.ogg', '.opus', '.mp3', '.wav', '.flac']
	if (!allowedExt.some(ext => file.originalname.endsWith(ext))) {
		throw new BadRequestException(`Unsupported audio extension: ${file.originalname}`)
	}
}
