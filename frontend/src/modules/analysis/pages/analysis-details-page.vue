<!-- src/modules/analysis/pages/analysis-details-page.vue -->
<template>
	<div class="bg-slate-100 min-h-screen text-slate-900">
		<!-- Header -->
		<header class="top-0 z-30 sticky bg-white/60 backdrop-blur-md border-slate-200 border-b">
			<div class="mx-auto px-5 py-4 max-w-screen-sm">
				<div class="flex justify-between items-center gap-4">
					<Button
						size="icon"
						variant="outline"
						type="button"
						@click="goBack"
					>
						<ArrowLeft class="w-5 h-5" />
					</Button>

					<!-- date / loading -->
					<h1 class="text-slate-500 text-sm truncate">
						<template v-if="isLoading">
							<Skeleton class="w-32 h-4" />
						</template>
						<template v-else-if="analysis">
							{{ formatDate(analysis.createdAt) }}
						</template>
					</h1>
				</div>

				<!-- Main row -->
				<div class="items-start gap-4 grid grid-cols-[1fr_auto] mt-4">
					<div>
						<div class="font-semibold text-xl leading-tight">
							<template v-if="isLoading">
								<Skeleton class="w-40 h-6" />
							</template>
							<template v-else-if="analysis">
								{{ formatCurrency(analysis.totalEstimatedCost) }}
							</template>
						</div>

						<div class="text-slate-600 truncate">
							<template v-if="isLoading">
								<Skeleton class="mt-1 w-64 h-4" />
							</template>
							<template v-else-if="analysis">
								{{ analysis.carModel }}, {{ analysis.city }}
							</template>
						</div>
					</div>

					<div
						class="inline-flex items-center gap-2 mt-1 px-2.5 py-1 border rounded-full font-medium text-xs"
						:class="riskChipClass"
					>
						<template v-if="isLoading">
							<Skeleton class="rounded-full w-20 h-5" />
						</template>
						<template v-else>
							<span class="tracking-wide">Риск</span>
							<span>•</span>
							<span>{{ riskRu }}</span>
						</template>
					</div>
				</div>
			</div>
		</header>

		<!-- Content / error / empty -->
		<div class="mx-auto px-4 max-w-screen-sm">
			<Card
				v-if="isError"
				class="mt-4"
			>
				<CardContent class="py-5">
					<p class="text-red-600 text-sm">Не удалось загрузить анализ. Попробуйте ещё раз.</p>
					<div class="mt-3">
						<Button
							variant="secondary"
							@click="refetch"
							>Обновить</Button
						>
					</div>
				</CardContent>
			</Card>

			<Card
				v-else-if="!isLoading && !analysis"
				class="mt-4"
			>
				<CardContent class="py-5">
					<p class="text-slate-700 text-sm">Анализ не найден.</p>
					<div class="flex gap-2 mt-3">
						<Button
							variant="secondary"
							@click="goBack"
							>К списку</Button
						>
						<Button @click="goScan">Сканировать авто</Button>
					</div>
				</CardContent>
			</Card>
		</div>

		<Tabs
			v-if="analysis"
			v-model="activeTab"
			class="mt-5 px-4"
		>
			<TabsList class="grid grid-cols-2 bg-slate-200 rounded-lg w-full h-12">
				<TabsTrigger
					value="summary"
					class="data-[state=active]:bg-white rounded-md data-[state=active]:text-slate-900"
				>
					Общий анализ
				</TabsTrigger>
				<TabsTrigger
					value="analysis"
					class="data-[state=active]:bg-white rounded-md data-[state=active]:text-slate-900"
				>
					Анализ по зонам
				</TabsTrigger>
			</TabsList>

			<!-- ANALYSIS TAB -->
			<div class="mt-3 max-w-screen-sm">
				<TabsContent
					value="analysis"
					:force-mount="true"
					v-show="activeTab === 'analysis'"
				>
					<!-- loading skeleton list -->
					<div
						v-if="isLoading"
						class="space-y-2"
					>
						<Card
							v-for="i in 3"
							:key="i"
							><CardContent class="py-4">
								<Skeleton class="mb-2 w-44 h-5" />
								<Skeleton class="w-full h-4" /> </CardContent
						></Card>
					</div>

					<Accordion
						v-else
						type="single"
						collapsible
						v-model="expandedZone"
						class="space-y-2"
					>
						<AccordionItem
							v-for="zone in analysis.zones"
							:key="zone.name"
							:value="zone.name"
							class="bg-white rounded-xl"
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
											class="mt-1 text-slate-500 text-sm"
										>
											{{ formatCurrency(zone.aiAnalysis.estimatedCost) }}
										</span>
									</div>
								</div>
							</AccordionTrigger>

							<AccordionContent>
								<Separator />
								<div class="space-y-4 px-4 pt-4 pb-4">
									<!-- Issues chips -->
									<div v-if="zone.breaking || zone.hasRust || zone.isDirty">
										<div class="flex flex-wrap gap-2">
											<Badge
												v-if="zone.breaking"
												variant="outline"
												class="bg-red-50 border-red-200 text-red-700"
											>
												<AlertTriangle class="mr-1 w-4 h-4" /> Поломка
											</Badge>
											<Badge
												v-if="zone.hasRust"
												variant="outline"
												class="bg-orange-50 border-orange-200 text-orange-700"
											>
												Ржавчина
											</Badge>
											<Badge
												v-if="zone.isDirty"
												variant="outline"
												class="bg-slate-50 border-slate-200 text-slate-700"
											>
												Загрязнение
											</Badge>
										</div>
									</div>

									<!-- AI analysis -->
									<p class="text-slate-700 text-sm">
										{{ zone.aiAnalysis.importance }}
									</p>

									<Card
										v-if="zone.aiAnalysis.consequences.length"
										class="bg-amber-50 border-amber-200"
									>
										<CardContent>
											<h4 class="mb-2 font-medium text-amber-900">К чему может привести:</h4>
											<ul class="space-y-1">
												<li
													v-for="(c, i) in zone.aiAnalysis.consequences"
													:key="i"
													class="flex items-start gap-2 text-amber-800 text-sm"
												>
													<span class="bg-amber-600 mt-2 rounded-full w-1.5 h-1.5"></span>
													{{ c }}
												</li>
											</ul>
										</CardContent>
									</Card>

									<!-- Cost / Time -->
									<div class="gap-3 grid grid-cols-2">
										<Card class="bg-orange-50 border-orange-200">
											<CardContent>
												<span class="font-medium text-orange-900">Стоимость</span>
												<p class="font-bold text-orange-800 text-lg">
													{{ zone.aiAnalysis.estimatedCost > 0 ? formatCurrency(zone.aiAnalysis.estimatedCost) : 'Бесплатно' }}
												</p>
											</CardContent>
										</Card>

										<Card class="bg-violet-50 border-violet-200">
											<CardContent>
												<span class="font-medium text-violet-900">Время</span>
												<p class="font-bold text-violet-800 text-lg">
													{{ zone.aiAnalysis.timeToFix || '—' }}
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
						<!-- Zones carousel -->
						<section class="bg-white border border-slate-200 rounded-3xl overflow-hidden">
							<header class="px-6 py-5">
								<h3 class="font-semibold text-xl">Состояние по сторонам</h3>
							</header>

							<div class="relative">
								<!-- arrows -->
								<div class="left-1 z-10 absolute inset-y-0 flex items-center">
									<Button
										size="icon"
										variant="ghost"
										class="bg-white/80 hover:bg-white border border-slate-200 rounded-full w-9 h-9"
										:disabled="activeIdx === 0"
										@click="prevSlide"
										aria-label="Назад"
									>
										<ChevronLeft class="w-5 h-5 text-slate-700" />
									</Button>
								</div>
								<div class="right-1 z-10 absolute inset-y-0 flex items-center">
									<Button
										size="icon"
										variant="ghost"
										class="bg-white/80 hover:bg-white border border-slate-200 rounded-full w-9 h-9"
										:disabled="activeIdx === visualZones.length - 1"
										@click="nextSlide"
										aria-label="Вперед"
									>
										<ChevronRight class="w-5 h-5 text-slate-700" />
									</Button>
								</div>

								<!-- track -->
								<div
									ref="carouselEl"
									class="[&::-webkit-scrollbar]:hidden flex gap-3 mx-4 py-3 [-ms-overflow-style:none] overflow-x-auto scroll-smooth snap-mandatory snap-x [scrollbar-width:none]"
									@scroll.passive="onScroll"
								>
									<!-- slides -->
									<button
										v-for="(z, i) in visualZones"
										:key="z.name"
										class="relative w-full snap-start shrink-0"
										:class="[ i===0 ? 'ms-4' : '', i===visualZones.length-1 ? 'me-4' : '' ]"
										@click="openZone(z.name)"
									>
										<img
											:src="z.img"
											:alt="`${z.name} часть`"
											class="w-full object-contain aspect-[16/9]"
											@error="onImgError"
										/>

										<!-- state chip -->
										<div class="top-3 left-3 absolute">
											<span
												class="backdrop-blur-sm px-2.5 py-1 border rounded-full font-semibold text-[11px]"
												:class="chipClass(z.state)"
											>
												{{ z.state === 'break' ? 'Поломка' : z.state === 'warn' ? 'Обслуживание' : 'Ок' }}
											</span>
										</div>

										<!-- percent only -->
										<div class="top-3 right-3 absolute">
											<span :class="['text-xl font-extrabold', percentColor(z.state)]">
												{{ Math.round(z.percent) }}%
											</span>
										</div>
									</button>
								</div>

								<!-- dots -->
								<div class="flex justify-center items-center gap-2 py-2">
									<span
										v-for="(_, i) in visualZones.length"
										:key="i"
										class="rounded-full h-1.5 transition-all"
										:class="activeIdx === i ? 'bg-emerald-600 w-6' : 'bg-slate-300 w-2'"
									/>
								</div>
							</div>
						</section>

						<!-- Summary card -->
						<Card class="bg-white">
							<CardContent>
								<div class="flex items-center gap-3 mb-4">
									<div class="bg-primary p-3 rounded-lg">
										<Shield class="w-6 h-6 text-primary-foreground" />
									</div>
									<div>
										<h2 class="font-bold text-lg">Общий анализ состояния</h2>
										<p class="text-slate-600 text-sm">Рекомендации ИИ на основе сканирования</p>
									</div>
								</div>

								<template v-if="isLoading">
									<Skeleton class="mb-2 w-full h-4" />
									<Skeleton class="w-4/5 h-4" />
								</template>
								<template v-else>
									<p class="text-slate-800 leading-relaxed">
										{{ analysis.summary || 'Детализация недоступна' }}
									</p>
								</template>
							</CardContent>
						</Card>

						<!-- Stats -->
						<div class="gap-3 grid grid-cols-2">
							<Card>
								<CardContent>
									<span class="font-base">Проблемных зон</span>
									<p class="mt-4 font-bold text-2xl">{{ activeZones.length }}</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<span class="font-base">Общая оценка</span>
									<p class="mt-4 font-bold text-2xl">{{ (analysis.overallScore ?? 0) }}%</p>
								</CardContent>
							</Card>
						</div>

						<!-- Priority order (derived) -->
						<Card>
							<CardContent>
								<div class="flex items-center gap-3 mb-4">
									<Zap class="w-6 h-6 text-amber-600" />
									<h3 class="font-semibold text-lg">Приоритет ремонта</h3>
								</div>
								<div class="space-y-2">
									<div
										v-for="(zoneName, idx) in priorityOrder"
										:key="zoneName"
										class="flex justify-between items-center bg-slate-50 p-3 rounded-lg"
									>
										<div class="flex items-center gap-3">
											<span
												class="place-items-center grid rounded-full w-6 h-6 font-bold text-sm"
												:class="priorityColors[idx] || 'bg-slate-200 text-slate-800'"
											>
												{{ idx + 1 }}
											</span>
											<span class="font-medium">{{ zoneName }} часть</span>
										</div>
										<span class="text-slate-700 text-sm">
											{{
                        (analysis.zones.find(z => z.name === zoneName)?.aiAnalysis.estimatedCost ?? 0) > 0
                          ? formatCurrency(analysis.zones.find(z => z.name === zoneName)!.aiAnalysis.estimatedCost)
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
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Shield, Wrench, Zap } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';



/* images (ok/warn/break for each zone) */
import imgFallback from '@/core/assets/zones/fallback.png';
import frontBreak from '@/core/assets/zones/front_break.png';
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
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';



/* data composable */
import { useAnalysis } from '@/modules/analysis/composables/analysis.composables';
import { type CarAnalysisDto, CarStatus } from '@/modules/analysis/models/analysis.models';





/* Router */
const router = useRouter()
const route = useRoute()
const goBack = () => router.push({ name: 'analysis' })
const goScan = () => router.push({ name: 'scan' })

/* Params -> id (number) */
const analysisId = computed(() => {
  const raw = route.params.id
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) ? n : undefined
})

/* Fetch */
const { data, isLoading, isError, refetch } = useAnalysis(analysisId)
const analysis = computed<CarAnalysisDto | undefined>(() => data.value)

/* UI state */
const activeTab = ref<'analysis' | 'summary'>('summary')
const expandedZone = ref<string | undefined>()

/* Helpers */
const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)

/* Risk mapping from server status */
type Risk = 'low' | 'medium' | 'high'
const statusToRisk = (s?: CarAnalysisDto['status']): Risk => {
  if (!s) return 'low'
  if (s === CarStatus.CRITICAL_CONDITION) return 'high'
  if (s === CarStatus.COSMETIC_ISSUES || s === CarStatus.MECHANICAL_SERVICE_NEEDED) return 'medium'
  return 'low'
}
const riskRu = computed(() => {
  const r = statusToRisk(analysis.value?.status)
  return r === 'high' ? 'Высокий' : r === 'medium' ? 'Средний' : 'Низкий'
})
const riskChipClass = computed(() => {
  const r = statusToRisk(analysis.value?.status)
  if (r === 'high') return 'border-red-300 text-red-700'
  if (r === 'medium') return 'border-amber-300 text-amber-700'
  return 'border-emerald-600 text-emerald-700'
})

/* Zone helpers (server DTO zones) */
const getZoneStatus = (z: CarAnalysisDto['zones'][number]) => {
  if (z.breaking) return { label: 'Поломка', colorBox: 'border-red-200 text-red-700', icon: AlertTriangle }
  if (z.hasRust || z.isDirty) return { label: 'Обслуживание', colorBox: 'border-amber-200 text-amber-700', icon: Wrench }
  return { label: 'Отлично', colorBox: 'border-green-500 text-green-500', icon: CheckCircle }
}
type ZoneState = 'ok' | 'warn' | 'break'
const zoneState = (z: CarAnalysisDto['zones'][number]): ZoneState =>
  z.breaking ? 'break' : (z.hasRust || z.isDirty) ? 'warn' : 'ok'

const keyOf = (n: CarAnalysisDto['zones'][number]['name']) =>
  n === 'Передняя' ? 'front' : n === 'Левая' ? 'left' : n === 'Правая' ? 'right' : 'rear'

const zoneImg = (name: CarAnalysisDto['zones'][number]['name'], st: ZoneState) => {
  const k = keyOf(name)
  const map: Record<string, Record<ZoneState, string>> = {
    front: { ok: frontOk, warn: frontWarn, break: frontBreak },
    left:  { ok: leftOk,  warn: leftWarn,  break: leftBreak  },
    right: { ok: rightOk, warn: rightWarn, break: rightBreak },
    rear:  { ok: rearOk,  warn: rearWarn,  break: rearBreak  }
  }
  return map[k]?.[st] || imgFallback
}
const issuePercent = (z: CarAnalysisDto['zones'][number]) => {
  if (z.breaking) return 100
  const p = (z.hasRust ? 60 : 0) + (z.isDirty ? 40 : 0)
  return Math.min(100, p)
}
const chipClass = (s: ZoneState) =>
  s === 'break'
    ? 'bg-red-50 text-red-700 border-red-200'
    : s === 'warn'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
const percentColor = (s: ZoneState) =>
  s === 'break' ? 'text-red-500' : s === 'warn' ? 'text-amber-500' : 'text-emerald-600'

/* Derived */
const activeZones = computed(() => (analysis.value?.zones ?? []).filter(z => z.breaking || z.hasRust || z.isDirty))

/** Priority (derived): break → warn → ok, tie by estimatedCost desc */
const priorityOrder = computed(() => {
  const zones = analysis.value?.zones ?? []
  const score = (z: CarAnalysisDto['zones'][number]) =>
    (z.breaking ? 3 : (z.hasRust || z.isDirty) ? 2 : 1) * 10 + (z.aiAnalysis.estimatedCost || 0) / 1e6
  return zones
    .slice()
    .sort((a, b) => score(b) - score(a))
    .map(z => z.name)
})

/* visual zone tiles */
const visualZones = computed(() => {
  const zones = analysis.value?.zones ?? []
  return zones.map((z) => {
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
const openZone = (name: CarAnalysisDto['zones'][number]['name']) => {
  activeTab.value = 'analysis'
  expandedZone.value = name
}

/* Carousel logic */
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
  let nearest = 0; let best = Infinity
  slideOffsets.value.forEach((off, i) => {
    const d = Math.abs(off - x)
    if (d < best) { best = d; nearest = i }
  })
  activeIdx.value = nearest
}
const ro = new ResizeObserver(() => measure())
onMounted(async () => { await nextTick(); if (carouselEl.value) ro.observe(carouselEl.value); measure() })
onBeforeUnmount(() => ro.disconnect())

/* Re-measure when data arrives or count changes */
watch(() => visualZones.value.length, async () => {
  await nextTick(); measure(); toIndex(0)
})

const priorityColors = [ 'bg-red-100 text-red-800', 'bg-amber-100 text-amber-800', 'bg-primary text-primary', 'bg-slate-200 text-slate-800' ]
</script>
