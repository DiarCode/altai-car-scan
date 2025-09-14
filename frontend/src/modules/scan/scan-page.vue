<template>
	<div class="bg-slate-100 min-h-screen text-slate-900">
		<!-- Sticky glass header -->
		<header
			class="top-0 z-30 sticky bg-white/70 backdrop-blur-md px-5 py-4 border-slate-200 border-b"
		>
			<div class="flex justify-between items-center">
				<Button
					size="icon"
					variant="ghost"
					@click="handleBack"
				>
					<ArrowLeft class="size-6 text-slate-700" />
				</Button>

				<h1 class="font-semibold text-lg tracking-tight">
					{{ currentStep === 'select' ? 'Выберите зону' : zones.find(z => z.key === selectedZone)?.title }}
				</h1>

				<!-- Progress 4 dots -->
				<div class="flex items-center gap-2">
					<div
						v-for="z in zones"
						:key="z.key"
						:class="[
              'w-2 h-2 rounded-full transition-all',
              capturedKeys.includes(z.key) ? 'bg-emerald-600'
                : selectedZone === z.key ? 'bg-emerald-500'
                : 'bg-slate-300'
            ]"
					/>
				</div>
			</div>
		</header>

		<!-- Step: select zone -->
		<section
			v-if="currentStep === 'select'"
			class="pb-[calc(env(safe-area-inset-bottom)+7.5rem)] space-y-5 mt-4 px-5"
		>
			<div class="space-y-3">
				<button
					v-for="z in zones"
					:key="z.key"
					@click="selectZone(z.key)"
					class="bg-white/60 hover:bg-white backdrop-blur-xl px-4 py-5 border border-slate-200 rounded-3xl w-full text-left transition-colors"
				>
					<div class="flex justify-between items-center">
						<div class="flex items-center gap-4 min-w-0">
							<img
								:src="z.icon"
								:alt="`${z.title}`"
								class="bg-slate-50 border border-slate-200 rounded-xl size-18 object-contain"
							/>
							<div class="min-w-0">
								<h3 class="font-semibold text-lg truncate">
									{{ z.title }}
								</h3>
								<p class="text-slate-600 text-sm truncate">{{ z.description }}</p>
							</div>
						</div>

						<div class="flex items-center gap-3">
							<CheckCircle2
								v-if="capturedKeys.includes(z.key)"
								class="size-6 text-emerald-600"
							/>
							<ChevronRight
								v-else
								class="size-6 text-slate-400"
							/>
						</div>
					</div>
				</button>
			</div>

			<!-- Submit (enabled if at least one shot) -->
			<div
				class="right-0 bottom-0 pb-[calc(env(safe-area-inset-bottom)+12px)] left-0 z-20 fixed bg-white/80 backdrop-blur px-5 pt-3 border-slate-200 border-t"
			>
				<Button
					class="w-full h-12"
					:disabled="!canSubmit || isPending"
					@click="submitAnalysis"
				>
					<template v-if="!isPending"> Отправить на анализ ({{ capturedCount }}/4) </template>
					<template v-else>
						<span class="inline-flex items-center gap-2">
							<span class="relative flex size-4">
								<span
									class="inline-flex absolute bg-primary opacity-30 rounded-full w-full h-full animate-ping"
								></span>
								<span class="inline-flex relative bg-primary rounded-full w-4 h-4"></span>
							</span>
							Загрузка {{ progress }}%
						</span>
					</template>
				</Button>
			</div>

			<div class="bg-white/70 backdrop-blur mt-1 p-4 border border-slate-200 rounded-2xl">
				<p class="text-slate-600 text-sm">
					Снимите 4 зоны. Совмещайте авто с прозрачной схемой. Чем ровнее — тем точнее анализ.
				</p>
			</div>
		</section>

		<!-- Step: live camera -->
		<section
			v-else-if="currentStep === 'camera'"
			class="flex flex-col h-[75vh]"
		>
			<div class="relative flex-1 overflow-hidden">
				<!-- Live video -->
				<video
					ref="videoEl"
					autoplay
					playsinline
					muted
					class="absolute inset-0 bg-slate-200 w-full h-full object-cover"
				/>

				<!-- Soft grid (CSS only) -->
				<div class="absolute inset-0 pointer-events-none">
					<div class="left-1/3 absolute inset-y-0 bg-primary/30 w-px"></div>
					<div class="left-2/3 absolute inset-y-0 bg-primary/30 w-px"></div>
					<div class="top-1/3 absolute inset-x-0 bg-primary/30 h-px"></div>
					<div class="top-2/3 absolute inset-x-0 bg-primary/30 h-px"></div>
				</div>

				<!-- Tip -->
				<div class="right-4 bottom-28 left-4 absolute">
					<div
						class="bg-white/90 backdrop-blur px-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm text-center"
					>
						{{ currentInstruction }}
					</div>
				</div>

				<!-- Error overlay -->
				<div
					v-if="errorMsg"
					class="absolute inset-0 place-items-center grid bg-white/85 backdrop-blur px-6 text-center"
				>
					<div class="space-y-3">
						<p class="text-slate-700 text-sm">{{ errorMsg }}</p>
						<Button @click="initCamera"><Camera class="w-4 h-4" /> Включить камеру</Button>
					</div>
				</div>
			</div>

			<!-- Controls -->
			<div class="bg-white/80 backdrop-blur-md px-5 py-4 border-slate-200 border-t">
				<div class="flex justify-between items-center">
					<Button
						variant="outline"
						class="px-4"
						@click="handleBack"
						>Отмена</Button
					>

					<button
						:disabled="!streamReady"
						@click="capturePhoto"
						:class="[
              'w-16 h-16 rounded-full grid place-items-center transition',
              streamReady ? 'bg-primary hover:bg-primary/80 text-primary-foreground' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            ]"
						aria-label="Сделать снимок"
					>
						<Camera class="w-6 h-6" />
					</button>

					<Button
						v-if="hasMultipleCameras"
						variant="outline"
						class="px-4"
						@click="switchCamera"
					>
						<RotateCcw class="w-5 h-5" />
					</Button>
					<div
						v-else
						class="w-[84px]"
					/>
				</div>
			</div>
		</section>

		<!-- Step: preview -->
		<section
			v-else-if="currentStep === 'preview'"
			class="pb-[calc(env(safe-area-inset-bottom)+7.5rem)] space-y-5 px-5"
		>
			<div
				class="bg-white/70 backdrop-blur-xl mt-4 border border-slate-200 rounded-3xl overflow-hidden"
			>
				<img
					:src="previewUrl"
					:alt="`Фото ${zones.find(z => z.key === selectedZone)?.title}`"
					class="w-full object-cover aspect-[4/3]"
				/>
			</div>

			<div class="bg-white/70 backdrop-blur p-4 border border-slate-200 rounded-2xl">
				<div class="flex items-start gap-3">
					<CheckCircle2 class="mt-0.5 w-5 h-5 text-primary" />
					<div>
						<h3 class="font-semibold">Качество снимка</h3>
						<p class="text-slate-700 text-sm">
							Проверьте резкость и совпадение с контуром. При необходимости переснимите.
						</p>
					</div>
				</div>
			</div>

			<div class="flex gap-3">
				<Button
					variant="outline"
					class="flex-1"
					@click="retakePhoto"
					>Переснять</Button
				>
				<Button
					class="flex-1"
					@click="acceptPhoto"
					>Принять</Button
				>
			</div>
		</section>

		<!-- Upload overlay -->
		<transition name="fade">
			<div
				v-if="isPending"
				class="z-40 fixed inset-0 place-items-center grid bg-white/70 backdrop-blur px-6"
			>
				<div class="bg-white shadow-sm p-5 border border-slate-200 rounded-2xl w-full max-w-sm">
					<div class="flex justify-between items-center mb-3">
						<h3 class="font-semibold">Отправка на анализ</h3>
						<Button
							size="sm"
							variant="ghost"
							@click="cancel"
							>Отменить</Button
						>
					</div>

					<div class="space-y-3">
						<div class="bg-slate-200 rounded-full w-full h-2 overflow-hidden">
							<div
								class="bg-primary h-2 transition-all"
								:style="{ width: `${progress}%` }"
							/>
						</div>
						<p class="text-slate-600 text-sm">Загружено: {{ progress }}%</p>
						<p class="text-slate-500 text-xs">Не закрывайте приложение до завершения.</p>
					</div>
				</div>
			</div>
		</transition>

		<!-- Hidden canvas for fallback capture -->
		<canvas
			ref="canvasEl"
			class="hidden"
		/>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Camera, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';



import imgFront from '@/core/assets/images/car-front.png';
import imgLeft from '@/core/assets/images/car-left.png';
import imgRear from '@/core/assets/images/car-rear.png';
import imgRight from '@/core/assets/images/car-right.png';
import { Button } from '@/core/components/ui/button';



/* data layer */
import { useAnalyzeCarWithProgress } from '../analysis/composables/analysis.composables';





type ZoneKeyUI = 'front' | 'left' | 'right' | 'rear'
type ZoneKeyApi = 'front' | 'back' | 'left' | 'right'

const router = useRouter()

/* Steps */
const currentStep = ref<'select' | 'camera' | 'preview'>('select')
const selectedZone = ref<ZoneKeyUI | ''>('')

/* Camera state */
const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const streamReady = ref(false)
const errorMsg = ref('')
const hasMultipleCameras = ref(false)
const availableCams = ref<MediaDeviceInfo[]>([])
const camIndex = ref(0)

/* Capture state */
const pendingBlob = ref<Blob | null>(null)
const previewUrl = ref<string>('')
const filesByZone = ref<Record<ZoneKeyUI, File | null>>({
  front: null,
  left: null,
  right: null,
  rear: null,
})
const thumbs = ref<Record<ZoneKeyUI, string | null>>({
  front: null,
  left: null,
  right: null,
  rear: null,
})

/* Composables (upload) */
const { analyze, progress, cancel, isPending } = useAnalyzeCarWithProgress()

/* Zones */
const zones = [
  { key: 'front', title: 'Передняя зона', description: 'Капот, бампер, фары', icon: imgFront },
  { key: 'left',  title: 'Левая сторона', description: 'Двери, крылья, пороги', icon: imgLeft },
  { key: 'right', title: 'Правая сторона', description: 'Двери, крылья, пороги', icon: imgRight },
  { key: 'rear',  title: 'Задняя зона',    description: 'Бампер, багажник, фонари', icon: imgRear },
] as const


const currentInstruction = computed(() => {
  switch (selectedZone.value) {
    case 'front': return 'Совместите передний бампер с прозрачной схемой.'
    case 'left':  return 'Держите камеру параллельно двери. Совместите контуры.'
    case 'right': return 'Держите камеру параллельно двери. Совместите контуры.'
    case 'rear':  return 'Совместите задний бампер с прозрачной схемой.'
    default:      return ''
  }
})

const capturedKeys = computed(() => (Object.keys(filesByZone.value) as ZoneKeyUI[]).filter(k => filesByZone.value[k]))
const capturedCount = computed(() => capturedKeys.value.length)
const canSubmit = computed(() => capturedCount.value > 0)

/* Actions */
function selectZone(z: ZoneKeyUI) {
  selectedZone.value = z
  currentStep.value = 'camera'
  initCamera()
}

async function initCamera() {
  errorMsg.value = ''
  streamReady.value = false
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCams.value = devices.filter(d => d.kind === 'videoinput')
    hasMultipleCameras.value = availableCams.value.length > 1

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    }
    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoEl.value) {
      videoEl.value.srcObject = stream.value
      await new Promise<void>(res => {
        if (!videoEl.value) return res()
        videoEl.value.onloadedmetadata = () => res()
      })
    }
    streamReady.value = true
  } catch (e) {
    console.error(e)
    errorMsg.value = 'Не удалось получить доступ к камере. Разрешите доступ и попробуйте снова.'
    toast.error('Камера недоступна', { description: 'Проверьте разрешение на доступ к камере. ' + e })
  }
}

const handleBack = () => {
  if (currentStep.value === 'select') {
    router.back()
  } else if (currentStep.value === 'camera') {
    stopCamera()
    currentStep.value = 'select'
    selectedZone.value = ''
  } else if (currentStep.value === 'preview') {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    pendingBlob.value = null
    currentStep.value = 'camera'
  }
}

async function switchCamera() {
  if (!hasMultipleCameras.value) return
  stopCamera()
  camIndex.value = (camIndex.value + 1) % availableCams.value.length
  try {
    const s = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: availableCams.value[camIndex.value].deviceId } },
      audio: false,
    })
    stream.value = s
    if (videoEl.value) videoEl.value.srcObject = s
    streamReady.value = true
  } catch (e) {
    console.error('switchCamera error', e)
    toast.error('Не удалось переключить камеру')
  }
}

/* Capture (ImageCapture -> fallback to canvas) */
async function capturePhoto() {
  if (!stream.value) return
  const track = stream.value.getVideoTracks()[0]
  try {
    // Preferred: ImageCapture (crisper, faster)
    const ImageCaptureCtor = window.ImageCapture
    if (ImageCaptureCtor) {
      const ic = new ImageCaptureCtor(track)
      pendingBlob.value = await ic.takePhoto()
    } else {
      // Fallback: canvas draw
      pendingBlob.value = await captureWithCanvas()
    }
    // Prepare preview URL
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(pendingBlob.value as Blob)

    stopCamera()
    currentStep.value = 'preview'
  } catch (e) {
    console.error(e)
    toast.error('Не удалось сделать снимок', { description: 'Попробуйте ещё раз или используйте другой браузер.' })
  }
}

async function captureWithCanvas(): Promise<Blob> {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) throw new Error('Canvas fallback unavailable')

  const w = video.videoWidth || 1920
  const h = video.videoHeight || 1080
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')
  ctx.drawImage(video, 0, 0, w, h)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', 0.92)
  })
}

function retakePhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  pendingBlob.value = null
  currentStep.value = 'camera'
  initCamera()
}

function acceptPhoto() {
  if (!selectedZone.value || !pendingBlob.value) return

  // Persist file + small thumb
  const fname = `${selectedZone.value}.jpg`
  const file = new File([pendingBlob.value], fname, { type: 'image/jpeg' })
  filesByZone.value[selectedZone.value] = file

  const smallUrl = previewUrl.value // lightweight enough for thumbnail; in prod you can make a reduced version
  thumbs.value[selectedZone.value] = smallUrl

  // Reset transient preview
  previewUrl.value = ''
  pendingBlob.value = null

  // Back to select
  currentStep.value = 'select'
  selectedZone.value = ''
  toast.success('Снимок сохранён', { description: 'Добавьте остальные стороны для точного анализа.' })
}

async function submitAnalysis() {
  if (!canSubmit.value || isPending.value) return

  try {
    // Map UI keys -> API keys (rear -> back)
    const apiFiles: Partial<Record<ZoneKeyApi, File>> = {
      front: filesByZone.value.front || undefined,
      back: filesByZone.value.rear || undefined,
      left: filesByZone.value.left || undefined,
      right: filesByZone.value.right || undefined,
    }

    await analyze(apiFiles)

    toast.success('Анализ выполнен', {
      description: 'Результат сохранён. Открываем отчёт…',
    })

    // Go to Analysis (it will load "latest")
    router.push({ name: 'analysis' })
  } catch {
    const msg =  'Не удалось выполнить анализ'
    toast.error('Ошибка анализа', { description: msg })
  }
}

function stopCamera() {
  if (stream.value) {
    for (const t of stream.value.getTracks()) t.stop()
    stream.value = null
  }
  streamReady.value = false
}

/* Lifecycle */
onMounted(async () => {
  // Soft permission warm-up (avoid scary prompts mid-flow)
  try { await navigator.mediaDevices.getUserMedia({ video: true, audio: false }) } catch {}
})
onUnmounted(() => {
  stopCamera()
  // cleanup object URLs
  Object.values(thumbs.value).forEach(u => u && URL.revokeObjectURL(u))
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
