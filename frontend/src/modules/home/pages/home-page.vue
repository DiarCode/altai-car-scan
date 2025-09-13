<template>
	<div
		class="relative min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900 overflow-hidden"
	>
		<!-- Subtle light pattern -->
		<div class="fixed inset-0 pointer-events-none opacity-10">
			<div
				class="absolute inset-0"
				:style="{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(148,163,184,0.3) 0%, transparent 45%)`
        }"
			/>
		</div>

		<!-- Header (sticky + glass) -->
		<header
			class="sticky top-0 z-20 px-6 py-4 bg-white/70 backdrop-blur-md border-b border-slate-200"
		>
			<div class="flex items-center justify-between">
				<h1 class="mt-0.5 text-2xl font-semibold tracking-tight">Главная</h1>

				<Button
					variant="ghost"
					size="lg"
					@click="onChangeCity"
				>
					{{ city }}

					<ChevronDown class="w-4 h-4 text-slate-600" />
				</Button>
			</div>
		</header>

		<!-- Main -->
		<main class="relative z-10 px-6 space-y-6 pb-32 mt-4 max-w-screen-sm mx-auto">
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
				<div>
					<div class="flex items-center gap-2 text-slate-600 text-sm">
						<Calendar class="w-4 h-4" />
						<span class="truncate">{{ formatDate(scanData.createdAt) }}</span>
					</div>
					<h3 class="mt-1 text-lg font-semibold tracking-tight">Последний анализ</h3>

					<!-- Priority mini-list -->
					<div class="mt-3 space-y-2">
						<div
							v-for="(zoneName, idx) in scanData.overallAnalysis.priorityOrder.slice(0,3)"
							:key="zoneName"
							class="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2"
						>
							<div class="flex items-center gap-2">
								<span
									class="w-6 h-6 rounded-full grid place-items-center text-xs font-bold"
									:class="priorityColors[idx] || 'bg-slate-200 text-slate-800'"
								>
									{{ idx + 1 }}
								</span>
								<span class="text-sm font-medium">{{ zoneName }} часть</span>
							</div>
							<span class="text-sm text-slate-700">
								{{
                    (scanData.zones.find(z => z.name === zoneName)?.aiAnalysis.estimatedCost ?? 0) > 0
                      ? formatCurrency(scanData.zones.find(z => z.name === zoneName)!.aiAnalysis.estimatedCost)
                      : 'Без затрат'
								}}
							</span>
						</div>
					</div>
				</div>

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

			<!-- Car Zones (boolean breaking + rust/dirty) -->
			<section class="rounded-3xl bg-white/60 backdrop-blur-xl border border-slate-200 p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold tracking-tight">Состояние автомобиля</h3>
					<div class="flex items-center gap-2 text-slate-600 text-sm">
						<Car class="w-4 h-4" />
						<span>4 зоны</span>
					</div>
				</div>

				<div class="divide-y divide-slate-200">
					<div
						v-for="zone in zonesUi"
						:key="zone.key"
						class="flex items-center justify-between py-4"
					>
						<div class="flex-1 min-w-0">
							<h4 class="text-base font-semibold truncate">{{ zone.title }}</h4>
							<p class="text-sm text-slate-600 truncate">{{ zone.note }}</p>

							<div class="flex items-center gap-2 mt-2">
								<span
									v-if="zone.isDirty"
									class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-medium border border-amber-200"
								>
									Грязь
								</span>
								<span
									v-if="zone.hasRust"
									class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-medium border border-red-200"
								>
									Ржавчина
								</span>
							</div>
						</div>

						<RouterLink
							:to="{ name: 'analysis-details', params: { id: lastScanId } }"
							class="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
							aria-label="Подробнее"
						>
							<ChevronRight class="w-5 h-5 text-slate-400" />
						</RouterLink>
					</div>
				</div>
			</section>
		</main>

		<TabBar />
	</div>
</template>

<script setup lang="ts">
import { Calendar, Car, ChevronDown, ChevronRight, ScanLine } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';



import { Button } from "@/core/components/ui/button";
import TabBar from '@/core/layouts/primary/primary-tabbar.vue';



import ReadinessGauge from '../components/home-readiness-gauge.vue';





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

const city = 'Алматы'

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

/** Zones UI (map names -> notes, boolean chips) */
type ZoneUi = {
  key: 'front' | 'left' | 'right' | 'rear'
  title: string
  note: string
  breaking: boolean
  hasRust: boolean
  isDirty: boolean
}
const zonesUi = computed<ZoneUi[]>(() => {
  const notes: Record<ZoneUi['key'], string> = {
    front: 'капот, бампер, фары',
    left: 'двери, крылья',
    right: 'двери, крылья',
    rear: 'багажник, бампер'
  }
  const mapKey = (name: ZoneAnalysis['name']): ZoneUi['key'] =>
    name === 'Передняя' ? 'front' : name === 'Левая' ? 'left' : name === 'Правая' ? 'right' : 'rear'

  return scanData.zones.map(z => {
    const key = mapKey(z.name)
    return {
      key,
      title: z.name,
      note: notes[key],
      breaking: z.breaking,
      hasRust: z.hasRust,
      isDirty: z.isDirty
    }
  })
})


/** Priority / Risk helpers */
const priorityColors = [
  'bg-red-100 text-red-800',
  'bg-amber-100 text-amber-800',
  'bg-primary text-primary-foreground',
  'bg-slate-200 text-slate-800'
]
const riskColor = (r: Risk) => (r === 'high' ? 'text-red-600' : r === 'medium' ? 'text-amber-600' : 'text-primary')
const riskLabel = (r: Risk) => (r === 'high' ? 'Высокий' : r === 'medium' ? 'Средний' : 'Низкий')

/** Formatters */
const formatDate = (d: Date) =>
  d.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)

/** Actions */
const onChangeCity = () => {
  // open city picker
}
</script>
