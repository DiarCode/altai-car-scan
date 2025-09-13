<!-- ScanDetails.vue -->
<template>
	<div class="min-h-screen bg-slate-100 text-slate-900">
		<!-- Sticky header -->
		<!-- Drop-in replacement for your header block -->
		<header
			class="sticky top-0 z-30 border-b border-slate-200 bg-white/60 backdrop-blur-md dark:bg-black/50"
		>
			<div class="mx-auto max-w-screen-sm py-4 px-5">
				<!-- Top row: Back -->
				<div class="flex items-center justify-between gap-4">
					<Button
						size="icon"
						variant="outline"
						type="button"
						@click="goBack"
					>
						<ArrowLeft class="h-5 w-5" />
					</Button>

					<h1 class="truncate text-sm text-slate-500 dark:text-slate-100">
						{{ formatDate(scanData.createdAt) }}
					</h1>
				</div>

				<!-- Main row -->
				<div class="grid grid-cols-[1fr_auto] items-start gap-4 mt-4">
					<!-- Left: date, car, city -->
					<div>
						<div class="text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
							{{ formatCurrency(scanData.totalEstimatedCost) }}
						</div>
						<span class="truncate">{{ scanData.carModel }}, {{ scanData.location }}</span>
					</div>

					<div
						class="mt-1 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium"
						:class="riskChipClass"
					>
						<span class="tracking-wide">Риск</span>
						<span>•</span>
						<span>{{ riskRu }}</span>
					</div>
				</div>
			</div>
		</header>
		<!-- Tabs -->
		<Tabs
			v-model="activeTab"
			class="mt-5 px-4"
		>
			<TabsList class="grid grid-cols-2 w-full bg-slate-200 h-12 rounded-lg">
				<TabsTrigger
					value="summary"
					class="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md"
				>
					Общий анализ
				</TabsTrigger>

				<TabsTrigger
					value="analysis"
					class="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md"
				>
					Анализ по зонам
				</TabsTrigger>
			</TabsList>

			<!-- Content -->
			<div class="max-w-screen-sm mt-3">
				<!-- ANALYSIS TAB -->
				<TabsContent
					value="analysis"
					:force-mount="true"
					v-show="activeTab === 'analysis'"
				>
					<Accordion
						type="single"
						collapsible
						v-model="expandedZone"
						class="space-y-2"
					>
						<AccordionItem
							v-for="zone in scanData.zones"
							:key="zone.name"
							:value="zone.name"
							class="rounded-xl bg-white"
						>
							<AccordionTrigger class="px-5 py-4 w-full">
								<div class="flex items-center gap-3">
									<div
										class="p-2 rounded-lg"
										:class="getZoneStatus(zone).colorBox"
									>
										<component
											:is="getZoneStatus(zone).icon"
											class="w-5 h-5"
										/>
									</div>
									<div>
										<h3 class="font-medium text-base">{{ zone.name }} часть</h3>
										<span
											v-if="zone.aiAnalysis.estimatedCost > 0"
											class="text-sm text-slate-500 mt-1"
										>
											{{ formatCurrency(zone.aiAnalysis.estimatedCost) }}
										</span>
									</div>
								</div>
							</AccordionTrigger>

							<AccordionContent>
								<Separator />
								<div class="px-4 pb-4 pt-4 space-y-4">
									<!-- Issues chips -->
									<div v-if="zone.breaking || zone.hasRust || zone.isDirty">
										<div class="flex flex-wrap gap-2">
											<Badge
												v-if="zone.breaking"
												variant="outline"
												class="bg-red-50 text-red-700 border-red-200"
											>
												<AlertTriangle class="w-4 h-4 mr-1" />
												Поломка
											</Badge>
											<Badge
												v-if="zone.hasRust"
												variant="outline"
												class="bg-orange-50 text-orange-700 border-orange-200"
											>
												Ржавчина
											</Badge>
											<Badge
												v-if="zone.isDirty"
												variant="outline"
												class="bg-slate-50 text-slate-700 border-slate-200"
											>
												Загрязнение
											</Badge>
										</div>
									</div>

									<!-- AI analysis blocks -->
									<p class="text-sm text-slate-700">
										{{ zone.aiAnalysis.importance }}
									</p>

									<Card
										v-if="zone.aiAnalysis.consequences.length"
										class="border-amber-200 bg-amber-50"
									>
										<CardContent>
											<div>
												<h4 class="font-medium text-amber-900 mb-2">К чему может привести:</h4>
												<ul class="space-y-1">
													<li
														v-for="(c, i) in zone.aiAnalysis.consequences"
														:key="i"
														class="text-sm text-amber-800 flex items-start gap-2"
													>
														<span class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2"></span>
														{{ c }}
													</li>
												</ul>
											</div>
										</CardContent>
									</Card>

									<!-- Cost / Time -->
									<div class="grid grid-cols-2 gap-3">
										<Card class="border-orange-200 bg-orange-50">
											<CardContent>
												<span class="font-medium text-orange-900">Стоимость</span>
												<p class="text-lg font-bold text-orange-800">
													{{ zone.aiAnalysis.estimatedCost > 0 ? formatCurrency(zone.aiAnalysis.estimatedCost) : 'Бесплатно' }}
												</p>
											</CardContent>
										</Card>

										<Card class="border-violet-200 bg-violet-50">
											<CardContent>
												<span class="font-medium text-violet-900">Время</span>
												<p class="text-lg font-bold text-violet-800">
													{{ zone.aiAnalysis.timeToFix }}
												</p>
											</CardContent>
										</Card>
									</div>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</TabsContent>

				<!-- SUMMARY TAB -->
				<TabsContent
					value="summary"
					:force-mount="true"
					v-show="activeTab === 'summary'"
				>
					<div class="space-y-4">
						<section class="rounded-3xl bg-white border border-slate-200 overflow-hidden">
							<header class="px-6 py-5">
								<h3 class="text-xl font-semibold">Состояние по сторонам</h3>
							</header>

							<div class="relative">
								<!-- arrows -->
								<div class="absolute inset-y-0 left-1 flex items-center z-10">
									<Button
										size="icon"
										variant="ghost"
										class="h-9 w-9 rounded-full bg-white/80 border border-slate-200 hover:bg-white"
										:disabled="activeIdx === 0"
										@click="prevSlide"
										aria-label="Назад"
									>
										<ChevronLeft class="w-5 h-5 text-slate-700" />
									</Button>
								</div>
								<div class="absolute inset-y-0 right-1 flex items-center z-10">
									<Button
										size="icon"
										variant="ghost"
										class="h-9 w-9 rounded-full bg-white/80 border border-slate-200 hover:bg-white"
										:disabled="activeIdx === visualZones.length - 1"
										@click="nextSlide"
										aria-label="Вперед"
									>
										<ChevronRight class="w-5 h-5 text-slate-700" />
									</Button>
								</div>

								<!-- track: edge-bleed (first slides stick out of left) -->
								<div
									ref="carouselEl"
									class="flex gap-3 mx-4 py-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
               [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
									@scroll.passive="onScroll"
								>
									<!-- slides: cardless -->
									<button
										v-for="(z, i) in visualZones"
										:key="z.name"
										class="snap-start shrink-0 w-full relative"
										:class="[ i===0 ? 'ms-4' : '', i===visualZones.length-1 ? 'me-4' : '' ]"
										@click="openZone(z.name)"
									>
										<!-- big image -->
										<img
											:src="z.img"
											:alt="`${z.name} часть`"
											class="w-full aspect-[16/9] object-contain"
											@error="onImgError"
										/>

										<!-- top-left: state chip + zone -->
										<div class="absolute left-3 top-3 flex items-center gap-2">
											<span
												class="px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm"
												:class="chipClass(z.state)"
											>
												{{ z.state === 'break' ? 'Поломка' : z.state === 'warn' ? 'Обслуживание' : 'Ок' }}
											</span>
										</div>

										<!-- top-right: percent ONLY (state color, no ring/chip) -->
										<div class="absolute right-3 top-3">
											<span :class="['text-xl font-extrabold', percentColor(z.state)]">
												{{ Math.round(z.percent) }}%
											</span>
										</div>
									</button>
								</div>

								<!-- dots -->
								<div class="py-2 flex items-center justify-center gap-2">
									<span
										v-for="(_, i) in visualZones.length"
										:key="i"
										class="h-1.5 rounded-full transition-all"
										:class="activeIdx === i ? 'bg-emerald-600 w-6' : 'bg-slate-300 w-2'"
									/>
								</div>
							</div>
						</section>

						<!-- Summary card -->
						<Card class="bg-white">
							<CardContent>
								<div class="flex items-center gap-3 mb-4">
									<div class="p-3 bg-primary rounded-lg">
										<Shield class="w-6 h-6 text-primary-foreground" />
									</div>
									<div>
										<h2 class="text-lg font-bold">Общий анализ состояния</h2>
										<p class="text-sm text-slate-600">Рекомендации ИИ на основе сканирования</p>
									</div>
								</div>
								<p class="text-slate-800 leading-relaxed">
									{{ scanData.overallAnalysis.summary }}
								</p>
							</CardContent>
						</Card>

						<!-- Stats -->
						<div class="grid grid-cols-2 gap-3">
							<Card>
								<CardContent>
									<span class="font-base">Проблемных зон</span>

									<p class="text-2xl font-bold mt-4">{{ activeZones.length }}</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<span class="font-base">Время ремонта</span>

									<p class="text-2xl font-bold mt-4">
										{{ scanData.overallAnalysis.totalTimeEstimate }}
									</p>
								</CardContent>
							</Card>
						</div>

						<!-- Priority order -->
						<Card>
							<CardContent>
								<div class="flex items-center gap-3 mb-4">
									<Zap class="w-6 h-6 text-amber-600" />
									<h3 class="text-lg font-semibold">Порядок приоритета ремонта</h3>
								</div>
								<div class="space-y-2">
									<div
										v-for="(zoneName, idx) in scanData.overallAnalysis.priorityOrder"
										:key="zoneName"
										class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
									>
										<div class="flex items-center gap-3">
											<span
												class="w-6 h-6 rounded-full grid place-items-center text-sm font-bold"
												:class="priorityColors[idx] || 'bg-slate-200 text-slate-800'"
											>
												{{ idx + 1 }}
											</span>
											<span class="font-medium">{{ zoneName }} часть</span>
										</div>
										<span class="text-sm text-slate-700">
											{{
                      (scanData.zones.find(z => z.name === zoneName)?.aiAnalysis.estimatedCost ?? 0) > 0
                        ? formatCurrency(scanData.zones.find(z => z.name === zoneName)!.aiAnalysis.estimatedCost)
                        : 'Не требует затрат'
											}}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</div>
		</Tabs>
	</div>
</template>

<script setup lang="ts">
import { AlertTriangle, ArrowLeft, CheckCircle, Shield, Wrench, Zap } from 'lucide-vue-next';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { nextTick, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';



import imgFallback from '@/core/assets/zones/fallback.png';
import frontBreak from '@/core/assets/zones/front_break.png';
// PNGs: one per zone × state (ok | warn | break)
import frontOk from '@/core/assets/zones/front_ok.png';
import frontWarn from '@/core/assets/zones/front_warn.png';
import leftBreak from '@/core/assets/zones/left_break.png';
import leftOk from '@/core/assets/zones/left_ok.png';
import leftWarn from '@/core/assets/zones/left_warn.png';
import rearBreak from '@/core/assets/zones/rear_break.png';
import rearOk from '@/core/assets/zones/rear_ok.png';
import rearWarn from '@/core/assets/zones/rear_warn.png';
import rightBreak from '@/core/assets/zones/right_break.png';
import rightOk from '@/core/assets/zones/right_ok.png';
import rightWarn from '@/core/assets/zones/right_warn.png';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';
import { Button } from "@/core/components/ui/button";
/* shadcn-vue */
import { Card, CardContent } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';





type Urgency = 'low' | 'medium' | 'high'
type Risk = 'low' | 'medium' | 'high'

type ZoneAnalysis = {
  name: 'Передняя' | 'Левая' | 'Правая' | 'Задняя'
  breaking: boolean
  hasRust: boolean
  isDirty: boolean
  aiAnalysis: {
    importance: string
    consequences: string[]
    estimatedCost: number
    urgency: Urgency
    timeToFix: string
  }
}

type ScanDetails = {
  id: string
  carModel: string
  location: string
  createdAt: Date
  totalEstimatedCost: number
  zones: ZoneAnalysis[]
  overallAnalysis: {
    summary: string
    priorityOrder: string[]
    totalTimeEstimate: string
    riskLevel: Risk
  }
}

/* router */
const router = useRouter()
const goBack = () => router.push({ name: 'analysis' })

/* state */
const activeTab = ref<'analysis' | 'summary'>('summary')
const expandedZone = ref<string | undefined>()

/* demo data (same as React) */
const scanData: ScanDetails = {
  id: 'scan_001',
  carModel: 'Toyota Camry 2019',
  location: 'Алматы',
  createdAt: new Date('2025-09-12T14:30:00'),
  totalEstimatedCost: 850000,
  zones: [
    {
      name: 'Передняя',
      breaking: true,
      hasRust: true,
      isDirty: true,
      aiAnalysis: {
        importance:
          'Передняя часть автомобиля критически важна для безопасности. Поломки в этой зоне могут повлиять на управляемость и тормозную систему.',
        consequences: [
          'Снижение эффективности торможения',
          'Проблемы с рулевым управлением',
          'Повышенный износ шин',
          'Риск аварийных ситуаций'
        ],
        estimatedCost: 450000,
        urgency: 'high',
        timeToFix: '2-3 дня'
      }
    },
    {
      name: 'Левая',
      breaking: false,
      hasRust: false,
      isDirty: false,
      aiAnalysis: {
        importance:
          'Левая сторона в отличном состоянии. Профилактическое обслуживание поможет сохранить текущее состояние.',
        consequences: [],
        estimatedCost: 0,
        urgency: 'low',
        timeToFix: 'Не требуется'
      }
    },
    {
      name: 'Правая',
      breaking: true,
      hasRust: false,
      isDirty: true,
      aiAnalysis: {
        importance:
          'Правая сторона имеет структурные повреждения, которые могут прогрессировать и привести к более серьезным проблемам.',
        consequences: [
          'Ухудшение аэродинамики',
          'Проникновение влаги внутрь кузова',
          'Коррозия металлических элементов',
          'Снижение стоимости автомобиля'
        ],
        estimatedCost: 280000,
        urgency: 'medium',
        timeToFix: '1-2 дня'
      }
    },
    {
      name: 'Задняя',
      breaking: false,
      hasRust: false,
      isDirty: true,
      aiAnalysis: {
        importance:
          'Задняя часть требует косметической очистки. Загрязнения могут скрывать начальные признаки износа.',
        consequences: [
          'Ухудшение внешнего вида',
          'Возможность пропустить ранние признаки коррозии',
          'Снижение видимости задних световых приборов'
        ],
        estimatedCost: 120000,
        urgency: 'low',
        timeToFix: '3-4 часа'
      }
    }
  ],
  overallAnalysis: {
    summary:
      'Автомобиль требует немедленного внимания к передней части из-за критических поломок. Правая сторона нуждается в ремонте в среднесрочной перспективе. Общее состояние требует комплексного подхода к восстановлению.',
    priorityOrder: ['Передняя', 'Правая', 'Задняя', 'Левая'],
    totalTimeEstimate: '4-6 дней',
    riskLevel: 'high'
  }
}

/* computed */
const activeZones = computed(() =>
  scanData.zones.filter(z => z.breaking || z.hasRust || z.isDirty)
)

const priorityColors = [
  'bg-red-100 text-red-800',
  'bg-amber-100 text-amber-800',
  'bg-primary text-primary',
  'bg-slate-200 text-slate-800'
]

/* helpers */
const formatDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)


const riskRu = computed(() => {
  const r = scanData.overallAnalysis.riskLevel
  return r === 'high' ? 'Высокий' : r === 'medium' ? 'Средний' : 'Низкий'
})

const riskChipClass = computed(() => {
  const r = scanData.overallAnalysis.riskLevel
  if (r === 'high') return 'border-red-300 text-red-700 dark:text-red-400'
  if (r === 'medium') return 'border-amber-300 text-amber-700 dark:text-amber-400'
  return 'border-primary text-primary'
})

const getZoneStatus = (z: ZoneAnalysis) => {
  if (z.breaking) return { label: 'Поломка', colorBox: 'border-red-200 text-red-700', icon: AlertTriangle }
  if (z.hasRust || z.isDirty) return { label: 'Обслуживание', colorBox: 'border-amber-200 text-amber-700', icon: Wrench }
  return { label: 'Отлично', colorBox: 'border-green-500 text-green-500', icon: CheckCircle }
}


// map name -> key
const keyOf = (n: ZoneAnalysis['name']) =>
  n === 'Передняя' ? 'front' : n === 'Левая' ? 'left' : n === 'Правая' ? 'right' : 'rear'

// state
type ZoneState = 'ok' | 'warn' | 'break'
const zoneState = (z: ZoneAnalysis): ZoneState =>
  z.breaking ? 'break' : (z.hasRust || z.isDirty) ? 'warn' : 'ok'

// choose PNG by zone & state
const zoneImg = (name: ZoneAnalysis['name'], st: ZoneState) => {
  const k = keyOf(name)
  const map: Record<string, Record<ZoneState, string>> = {
    front: { ok: frontOk, warn: frontWarn, break: frontBreak },
    left:  { ok: leftOk,  warn: leftWarn,  break: leftBreak  },
    right: { ok: rightOk, warn: rightWarn, break: rightBreak },
    rear:  { ok: rearOk,  warn: rearWarn,  break: rearBreak  }
  }
  return map[k]?.[st] || imgFallback
}

// % issues (boolean model → readable %)
const issuePercent = (z: ZoneAnalysis) => {
  if (z.breaking) return 100
  const p = (z.hasRust ? 60 : 0) + (z.isDirty ? 40 : 0) // both=100, rust=60, dirty=40
  return Math.min(100, p)
}

const chipClass = (s: ZoneState) =>
  s === 'break'
    ? 'bg-red-50 text-red-700 border-red-200'
    : s === 'warn'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

// precompute visual tiles for summary grid
const visualZones = computed(() => {
  return scanData.zones.map((z) => {
    const st = zoneState(z)
    return {
      name: z.name,
      state: st,
      img: zoneImg(z.name, st),
      percent: issuePercent(z),
      cost: z.aiAnalysis.estimatedCost,
      hasRust: z.hasRust,
      isDirty: z.isDirty,
      breaking: z.breaking
    }
  })
})

const onImgError = (e: Event) => {
  const t = e.target as HTMLImageElement
  if (t && t.src !== imgFallback) t.src = imgFallback
}

// open zone details
const openZone = (name: ZoneAnalysis['name']) => {
  activeTab.value = 'analysis'
  expandedZone.value = name
}

// Color for percent text
const percentColor = (s: ZoneState) =>
  s === 'break' ? 'text-red-500' : s === 'warn' ? 'text-amber-500' : 'text-emerald-600'


const carouselEl = ref<HTMLDivElement | null>(null)
const activeIdx = ref(0)
const slideOffsets = ref<number[]>([])

const measure = () => {
  const el = carouselEl.value
  if (!el) return
  slideOffsets.value = Array.from(el.children).map(
    (c) => (c as HTMLElement).offsetLeft - el.offsetLeft
  )
}

const toIndex = (i: number) => {
  const el = carouselEl.value
  if (!el) return
  const clamped = Math.max(0, Math.min(i, slideOffsets.value.length - 1))
  el.scrollTo({ left: slideOffsets.value[clamped] ?? 0, behavior: 'smooth' })
  activeIdx.value = clamped
}

const prevSlide = () => toIndex(activeIdx.value - 1)
const nextSlide = () => toIndex(activeIdx.value + 1)

const onScroll = () => {
  const el = carouselEl.value
  if (!el || slideOffsets.value.length === 0) return
  const x = el.scrollLeft
  let nearest = 0
  let best = Number.POSITIVE_INFINITY
  slideOffsets.value.forEach((off, i) => {
    const d = Math.abs(off - x)
    if (d < best) { best = d; nearest = i }
  })
  activeIdx.value = nearest
}

const ro = new ResizeObserver(() => measure())
onMounted(async () => { await nextTick(); if (carouselEl.value) ro.observe(carouselEl.value); measure() })
onBeforeUnmount(() => ro.disconnect())
</script>
