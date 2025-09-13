import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { TtsService } from './tts.service'
import { TtsRequestDto, TtsResponseDto } from './dto/tts.dto'
import { LearnerAuthGuard } from 'src/common/guards/learner-auth.guard'

@UseGuards(LearnerAuthGuard)
@Controller('tts')
export class TtsController {
	constructor(private readonly tts: TtsService) {}

	@Post()
	async create(@Body() dto: TtsRequestDto): Promise<TtsResponseDto> {
		const voice = dto.voice || 'default'
		const { key, url, bytes } = await this.tts.getOrCreate(dto.text, voice)
		return { key, url, bytes }
	}
}
