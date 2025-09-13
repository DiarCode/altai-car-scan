<template>
	<div
		class="relative min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900 overflow-hidden"
	>
		<!-- Header (sticky + glass) -->
		<header
			class="sticky top-0 z-20 px-6 py-4 bg-white/70 backdrop-blur-md border-b border-slate-200"
		>
			<div class="flex items-center justify-between">
				<h1 class="mt-0.5 text-2xl font-semibold tracking-tight">Главная</h1>

				<div class="flex items-center gap-2">
					<Button
						size="icon"
						variant="ghost"
					>
						<Bell class="size-5 text-slate-600" />
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger>
							<Avatar>
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem class="text-destructive">
								<LogOut class="mr-2 text-destructive" /> Выйти
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>

		<!-- Main -->
		<main class="relative z-10 px-6 space-y-4 pb-32 mt-4 max-w-screen-sm mx-auto">
			<!-- Readiness -->
			<section class="rounded-3xl bg-white/60 backdrop-blur-xl border border-slate-200 p-6">
				<div class="flex items-center justify-between gap-4 mb-4">
					<div class="min-w-0">
						<p class="text-sm text-slate-600">Обновлено {{ updatedRelative }}</p>
						<h2 class="mt-1 text-[22px] leading-snug font-semibold">Готовность к поездке</h2>
						<p :class="`mt-1 text-base font-semibold ${readinessStatus.color}`">
							{{ readinessStatus.text }}
						</p>
					</div>
					<ReadinessGauge
						:value="readiness"
						:tone="gaugeTone"
					/>
				</div>

				<div class="flex gap-3">
					<RouterLink
						:to="{ name: 'scan' }"
						class="flex-1 flex items-center justify-center gap-3 bg-primary hover:bg-primary/80 text-primary-foreground transition-colors rounded-2xl py-4 px-6"
					>
						<ScanLine class="w-5 h-5" />
						<span class="font-semibold text-base">Сканировать</span>
					</RouterLink>

					<RouterLink
						:to="{ name: 'analysis-details', params: { id: lastScanId } }"
						class="inline-flex items-center justify-center px-5 py-3.5 rounded-2xl bg-white/70 border border-slate-200 hover:bg-white transition-colors"
					>
						<ChevronRight class="w-5 h-5 text-slate-700" />
					</RouterLink>
				</div>
			</section>

			<!-- Latest Analysis (summary + priority) -->
			<section class="rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200 p-6">
				<div class="flex items-center justify-between gap-2">
					<div>
						<h3 class="text-xl font-semibold tracking-tight">Последний анализ</h3>
						<span class="text-sm text-slate-600">{{ formatDate(scanData.createdAt) }}</span>
					</div>

					<ArrowRight class="size-6 text-slate-700" />
				</div>

				<!-- Priority with illustrations -->
				<div class="mt-4 space-y-3">
					<div
						v-for="item in priorityTop"
						:key="item.name"
						class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3"
					>
						<!-- Illustration -->
						<img
							:src="item.img"
							:alt="`${item.name} часть — иллюстрация`"
							class="size-18 object-contain rounded-xl bg-slate-50 border border-slate-200"
							@error="onImgError"
						/>

						<!-- Text -->
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold truncate">{{ item.name }} часть</p>
							<span class="text-sm text-slate-700 whitespace-nowrap">
								{{ item.cost > 0 ? formatCurrency(item.cost) : 'Без затрат' }}
							</span>

							<!-- Issue chips -->
							<div class="mt-2 flex flex-wrap items-center gap-1.5">
								<span
									v-if="item.breaking"
									class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-200"
								>
									Поломка
								</span>
								<span
									v-if="item.hasRust"
									class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200"
								>
									Ржавчина
								</span>
								<span
									v-if="item.isDirty"
									class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
								>
									Грязь
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Risk / Total -->
				<div class="flex items-start justify-between mt-6">
					<div>
						<p class="text-xs text-slate-500">Риск</p>
						<p :class="['font-semibold', riskColor(scanData.overallAnalysis.riskLevel)]">
							{{ riskLabel(scanData.overallAnalysis.riskLevel) }}
						</p>
					</div>

					<div>
						<p class="text-xs text-slate-500">Итого</p>
						<p class="text-base font-semibold">
							{{ formatCurrency(scanData.totalEstimatedCost) }}
						</p>
					</div>
				</div>
			</section>
		</main>

		<TabBar />
	</div>
</template>

<script setup lang="ts">
import { ArrowRight, Bell, ChevronRight, LogOut, ScanLine } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';



import imgFront from '@/core/assets/images/car-front.png';
import imgLeft from '@/core/assets/images/car-left.png';
import imgRear from '@/core/assets/images/car-rear.png';
import imgRight from '@/core/assets/images/car-right.png';
import imgFallback from '@/core/assets/images/fallback.png';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/core/components/ui/dropdown-menu';
import TabBar from '@/core/layouts/primary/primary-tabbar.vue';



import ReadinessGauge from '../components/home-readiness-gauge.vue';





// 2) Map zone name -> image
const zoneImageMap: Record<'Передняя' | 'Левая' | 'Правая' | 'Задняя', string> = {
  'Передняя': imgFront,
  'Левая': imgLeft,
  'Правая': imgRight,
  'Задняя': imgRear
}

const priorityTop = computed(() => {
  return scanData.overallAnalysis.priorityOrder.slice(0, 3).map((name, index) => {
    const zone = scanData.zones.find(z => z.name === name)
    const cost = zone?.aiAnalysis.estimatedCost ?? 0
    return {
      index,
      name,
	  img: zoneImageMap[name as keyof typeof zoneImageMap],
      cost,
      importance: zone?.aiAnalysis.importance ?? '',
      breaking: zone?.breaking ?? false,
      hasRust: zone?.hasRust ?? false,
      isDirty: zone?.isDirty ?? false
    }
  })
})

// 4) Fallback if an image fails to load
const onImgError = (e: Event) => {
  const t = e.target as HTMLImageElement
  if (t && t.src !== imgFallback) t.src = imgFallback
}


/** Demo: latest analysis (same structure as details page) */
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
    priorityOrder: string[]
    totalTimeEstimate: string
    riskLevel: Risk
  }
}

// Mock latest scan data (replace with API/store)
const scanData: ScanDetails = {
  id: 'scan_001',
  carModel: 'Toyota Camry 2019',
  location: 'Алматы',
  createdAt: new Date('2025-09-12T14:30:00'),
  totalEstimatedCost: 850000,
  zones: [
    {
      name: 'Передняя', breaking: true, hasRust: true, isDirty: true,
      aiAnalysis: {
        importance: 'Передняя часть критически важна для безопасности и торможения.',
        consequences: ['Снижение эффективности торможения', 'Риск аварийных ситуаций'],
        estimatedCost: 450000, urgency: 'high', timeToFix: '2-3 дня'
      }
    },
    {
      name: 'Левая', breaking: false, hasRust: false, isDirty: false,
      aiAnalysis: { importance: 'Состояние отличное.', consequences: [], estimatedCost: 0, urgency: 'low', timeToFix: '—' }
    },
    {
      name: 'Правая', breaking: true, hasRust: false, isDirty: true,
      aiAnalysis: {
        importance: 'Повреждения могут прогрессировать.',
        consequences: ['Проникновение влаги', 'Коррозия элементов'],
        estimatedCost: 280000, urgency: 'medium', timeToFix: '1-2 дня'
      }
    },
    {
      name: 'Задняя', breaking: false, hasRust: false, isDirty: true,
      aiAnalysis: {
        importance: 'Нужна чистка: загрязнения скрывают износ.',
        consequences: ['Плохая видимость фонарей'],
        estimatedCost: 120000, urgency: 'low', timeToFix: '3-4 часа'
      }
    }
  ],
  overallAnalysis: {
    priorityOrder: ['Передняя', 'Правая', 'Задняя', 'Левая'],
    totalTimeEstimate: '4–6 дней',
    riskLevel: 'high'
  }
}

const lastScanId = scanData.id

/** Relative “updated” label from latest scan time */
const updatedRelative = computed(() => {
  const now = Date.now()
  const delta = Math.max(0, now - scanData.createdAt.getTime())
  const m = Math.floor(delta / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  return `${d} дн. назад`
})

/** Readiness from issue counts (boolean model) */
const readiness = computed(() => {
  const breaking = scanData.zones.filter(z => z.breaking).length
  const maint = scanData.zones.filter(z => z.hasRust || z.isDirty).length
  const maintOnly = Math.max(0, maint - breaking)
  const score = 100 - breaking * 18 - maintOnly * 6
  return Math.min(100, Math.max(40, score))
})

const gaugeTone = computed<'primary' | 'amber' | 'red'>(() =>
  readiness.value >= 80 ? 'primary' : readiness.value >= 60 ? 'amber' : 'red'
)

const readinessStatus = computed(() => {
  if (readiness.value >= 80) return { text: 'Отличное состояние', color: 'text-primary' }
  if (readiness.value >= 60) return { text: 'Требует внимания', color: 'text-amber-600' }
  return { text: 'Критическое состояние', color: 'text-red-600' }
})

const riskColor = (r: Risk) => (r === 'high' ? 'text-red-600' : r === 'medium' ? 'text-amber-600' : 'text-primary')
const riskLabel = (r: Risk) => (r === 'high' ? 'Высокий' : r === 'medium' ? 'Средний' : 'Низкий')

/** Formatters */
const formatDate = (d: Date) =>
  d.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)
</script>
