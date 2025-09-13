<template>
	<div class="min-h-screen bg-slate-100 text-slate-900">
		<!-- Sticky glass header -->
		<header
			class="sticky top-0 z-30 px-5 py-4 bg-white/70 backdrop-blur-md border-b border-slate-200"
		>
			<div class="flex items-center justify-between">
				<Button
					size="icon"
					variant="ghost"
					@click="handleBack"
				>
					<ArrowLeft class="size-6 text-slate-700" />
				</Button>

				<h1 class="text-lg font-semibold tracking-tight">
					{{ currentStep === 'select' ? 'Выберите зону' : zones.find(z => z.key === selectedZone)?.title }}
				</h1>

				<!-- Progress 4 dots -->
				<div class="flex items-center gap-2">
					<div
						v-for="z in zones"
						:key="z.key"
						:class="[
              'w-2 h-2 rounded-full transition-all',
              capturedZones.includes(z.key) ? 'bg-lime-600'
                : selectedZone === z.key ? 'bg-lime-600'
                : 'bg-slate-300'
            ]"
					/>
				</div>
			</div>
		</header>

		<!-- Step: select zone -->
		<section
			v-if="currentStep === 'select'"
			class="px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] space-y-5 mt-4"
		>
			<div class="space-y-3">
				<button
					v-for="z in zones"
					:key="z.key"
					@click="selectZone(z.key)"
					class="w-full rounded-3xl bg-white/60 backdrop-blur-xl border border-slate-200 px-4 py-6 text-left hover:bg-white transition-colors"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<component
								:is="z.icon"
								class="size-7 text-lime-600"
							/>
							<div>
								<h3 class="text-lg font-semibold">{{ z.title }}</h3>
								<p class="text-sm text-slate-600">{{ z.description }}</p>
							</div>
						</div>
						<CheckCircle2
							v-if="capturedZones.includes(z.key)"
							class="size-7 text-lime-600"
						/>
						<ChevronRight
							v-else
							class="size-6 text-slate-400"
						/>
					</div>
				</button>
			</div>

			<button
				v-if="capturedZones.length === 4"
				class="w-full mt-4 rounded-2xl bg-primary hover:bg-primary/80 text-white font-semibold py-3"
				@click="completeScanning"
			>
				Завершить сканирование
			</button>

			<div class="mt-4 rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-4">
				<p class="text-sm text-slate-600">
					Сфотографируйте все 4 зоны. Совмещайте авто с прозрачной схемой на экране.
				</p>
			</div>
		</section>

		<!-- Step: live camera -->
		<section
			v-else-if="currentStep === 'camera'"
			class="flex flex-col h-[calc(100vh-64px)]"
		>
			<div class="relative flex-1 overflow-hidden">
				<!-- Live video -->
				<video
					ref="videoEl"
					autoplay
					playsinline
					muted
					class="absolute inset-0 w-full h-full object-cover bg-slate-200"
				/>

				<!-- PNG overlay for alignment -->
				<img
					v-if="overlaySrc"
					:src="overlaySrc"
					alt="overlay"
					class="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
				/>

				<!-- Soft grid (CSS only) -->
				<div class="absolute inset-0 pointer-events-none">
					<div class="absolute inset-y-0 left-1/3 w-px bg-primary/15"></div>
					<div class="absolute inset-y-0 left-2/3 w-px bg-primary/15"></div>
					<div class="absolute inset-x-0 top-1/3 h-px bg-primary/15"></div>
					<div class="absolute inset-x-0 top-2/3 h-px bg-primary/15"></div>
				</div>

				<!-- Tip -->
				<div class="absolute bottom-28 left-4 right-4">
					<div
						class="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 text-center text-sm text-slate-800"
					>
						{{ currentInstruction }}
					</div>
				</div>

				<!-- Error overlay -->
				<div
					v-if="errorMsg"
					class="absolute inset-0 grid place-items-center bg-white/85 backdrop-blur text-center px-6"
				>
					<div>
						<p class="text-sm text-slate-700">{{ errorMsg }}</p>
						<Button @click="initCamera"><Camera class="w-4 h-4" /> Включить камеру</Button>
					</div>
				</div>
			</div>

			<!-- Controls -->
			<div class="px-5 py-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
				<div class="flex justify-center">
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

					<button
						v-if="hasMultipleCameras"
						class="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium hover:bg-slate-50"
						@click="switchCamera"
					>
						<RotateCcw class="w-5 h-5" />
					</button>
				</div>
			</div>
		</section>

		<!-- Step: preview -->
		<section
			v-else-if="currentStep === 'preview'"
			class="px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] space-y-5"
		>
			<div
				class="mt-4 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-slate-200"
			>
				<img
					:src="capturedPhoto"
					:alt="`Фото ${zones.find(z => z.key === selectedZone)?.title}`"
					class="w-full aspect-[4/3] object-cover"
				/>
			</div>

			<div class="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-4">
				<div class="flex items-start gap-3">
					<CheckCircle2 class="w-5 h-5 text-primary mt-0.5" />
					<div>
						<h3 class="font-semibold">Качество снимка</h3>
						<p class="text-sm text-slate-700">
							Проверьте резкость и совпадение с контуром. При необходимости переснимите.
						</p>
					</div>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					class="flex-1 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium hover:bg-slate-50"
					@click="retakePhoto"
				>
					Переснять
				</button>
				<button
					class="flex-1 px-5 py-3 rounded-xl bg-primary hover:bg-primary/60 text-white font-semibold"
					@click="acceptPhoto"
				>
					Принять
				</button>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { ArrowLeft, Camera, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';



// PNG overlays (replace with your real assets)
import OverlayFront from '@/core/assets/overlays/front.png';
import OverlayLeft from '@/core/assets/overlays/left.png';
import OverlayRear from '@/core/assets/overlays/rear.png';
import OverlayRight from '@/core/assets/overlays/right.png';
import { Button } from "@/core/components/ui/button";





// Router
const router = useRouter()

// Steps
const currentStep = ref<'select' | 'camera' | 'preview'>('select')
const selectedZone = ref<'front' | 'left' | 'right' | 'rear' | ''>('')

// Camera state
const videoEl = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const streamReady = ref(false)
const errorMsg = ref('')
const hasMultipleCameras = ref(false)
const availableCams = ref<MediaDeviceInfo[]>([])
const camIndex = ref(0)

// Capture state
const capturedZones = ref<Array<'front' | 'left' | 'right' | 'rear'>>([])
const capturedPhoto = ref<string>('')

// Zones
const zones = [
  { key: 'front', title: 'Передняя зона', description: 'Капот, бампер, фары', icon: Camera },
  { key: 'left',  title: 'Левая сторона', description: 'Двери, крылья, пороги', icon: Camera },
  { key: 'right', title: 'Правая сторона', description: 'Двери, крылья, пороги', icon: Camera },
  { key: 'rear',  title: 'Задняя зона',    description: 'Бампер, багажник, фонари', icon: Camera }
] as const

// Overlay mapping
const overlaySrc = computed(() => {
  switch (selectedZone.value) {
    case 'front': return OverlayFront
    case 'left':  return OverlayLeft
    case 'right': return OverlayRight
    case 'rear':  return OverlayRear
    default:      return ''
  }
})

// Instruction
const currentInstruction = computed(() => {
  switch (selectedZone.value) {
    case 'front': return 'Совместите передний бампер с прозрачной схемой.'
    case 'left':  return 'Держите камеру параллельно двери. Совместите контуры.'
    case 'right': return 'Держите камеру параллельно двери. Совместите контуры.'
    case 'rear':  return 'Совместите задний бампер с прозрачной схемой.'
    default:      return ''
  }
})


// Actions
function selectZone(z: 'front' | 'left' | 'right' | 'rear') {
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
        height: { ideal: 1080 }
      }
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
    currentStep.value = 'camera'
    capturedPhoto.value = ''
  }
}

async function switchCamera() {
  if (!hasMultipleCameras.value) return
  stopCamera()
  camIndex.value = (camIndex.value + 1) % availableCams.value.length
  try {
    const s = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: availableCams.value[camIndex.value].deviceId } },
      audio: false
    })
    stream.value = s
    if (videoEl.value) videoEl.value.srcObject = s
    streamReady.value = true
  } catch (e) {
    console.error('switchCamera error', e)
  }
}

// Capture without canvas (ImageCapture API)
async function capturePhoto() {
  if (!stream.value) return
  const track = stream.value.getVideoTracks()[0]
  try {
    const ImageCaptureCtor = window.ImageCapture
    if (!ImageCaptureCtor) throw new Error('ImageCaptureUnsupported')

    const ic = new ImageCaptureCtor(track)
    const blob: Blob = await ic.takePhoto()
    capturedPhoto.value = URL.createObjectURL(blob)

    stopCamera()
    currentStep.value = 'preview'
  } catch (e) {
    console.error(e)
    alert('Ваш браузер не поддерживает прямой снимок (ImageCapture). Откройте в современном Chrome/Safari.')
  }
}

function retakePhoto() {
  currentStep.value = 'camera'
  initCamera()
}

function acceptPhoto() {
  if (selectedZone.value && !capturedZones.value.includes(selectedZone.value)) {
    capturedZones.value.push(selectedZone.value)
  }
  currentStep.value = 'select'
  selectedZone.value = ''
  capturedPhoto.value = ''
}

function completeScanning() {
  router.push({ name: 'analysis-details', params: { id: 'new_scan' } })
}

function stopCamera() {
  if (stream.value) {
    for (const t of stream.value.getTracks()) t.stop()
    stream.value = null
  }
  streamReady.value = false
}

// Lifecycle
onMounted(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  } catch {
    /* permission denied silently on mount */
  }
})

onUnmounted(stopCamera)
</script>
