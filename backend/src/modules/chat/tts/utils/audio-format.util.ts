export function isMp3(buffer: Buffer): boolean {
	// ID3 tag "ID3" or MP3 frame sync 0xFF 0xFB
	return (
		(buffer.length > 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
		(buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xfb)
	)
}

export function isWav(buffer: Buffer): boolean {
	return (
		buffer.length > 12 &&
		buffer[0] === 0x52 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x46 &&
		buffer[8] === 0x57 &&
		buffer[9] === 0x41 &&
		buffer[10] === 0x56 &&
		buffer[11] === 0x45
	)
}

export function isOgg(buffer: Buffer): boolean {
	return (
		buffer.length > 4 &&
		buffer[0] === 0x4f &&
		buffer[1] === 0x67 &&
		buffer[2] === 0x67 &&
		buffer[3] === 0x53
	)
}

export function isM4a(buffer: Buffer): boolean {
	// MP4/M4A 'ftyp' box at offset 4
	return (
		buffer.length > 12 &&
		buffer[4] === 0x66 &&
		buffer[5] === 0x74 &&
		buffer[6] === 0x79 &&
		buffer[7] === 0x70
	)
}

export function detectFormat(buffer: Buffer): { ext: string; contentType: string } {
	if (isMp3(buffer)) return { ext: 'mp3', contentType: 'audio/mpeg' }
	if (isWav(buffer)) return { ext: 'wav', contentType: 'audio/wav' }
	if (isOgg(buffer)) return { ext: 'ogg', contentType: 'audio/ogg' }
	if (isM4a(buffer)) return { ext: 'm4a', contentType: 'audio/mp4' }
	return { ext: 'mp3', contentType: 'audio/mpeg' }
}
