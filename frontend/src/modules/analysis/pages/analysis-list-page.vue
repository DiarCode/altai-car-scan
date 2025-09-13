<template>
	<div class="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
		<!-- Header -->
		<header
			class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 pt-4 pb-3"
		>
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">История</p>
					<h1 class="mt-0.5 text-xl sm:text-2xl font-semibold truncate">Анализ сканирований</h1>
				</div>
				<div class="flex items-center gap-2 shrink-0">
					<button
						class="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:opacity-90 transition"
						@click="toggleSortOrder"
						aria-label="Сортировать по дате"
					>
						<ArrowUpDown class="w-5 h-5 text-slate-700" />
					</button>
					<button
						class="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:opacity-90 text-white font-medium"
						@click="$router.push({ name: 'scan' })"
					>
						<Plus class="w-4 h-4 inline -mt-0.5" />
						<span class="ml-1 hidden xs:inline">Скан</span>
					</button>
				</div>
			</div>

			<!-- Segmented filter -->
			<div class="mt-3 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
				<button
					v-for="opt in FILTERS"
					:key="opt.value"
					@click="selectedFilter = opt.value"
					:class="[
            'h-9 rounded-lg text-xs font-medium transition',
            selectedFilter === opt.value
              ? 'bg-white text-slate-900'
              : 'text-slate-600'
          ]"
				>
					{{ opt.label }}
				</button>
			</div>
			<div class="mt-2 text-[11px] text-slate-500">
				{{ filteredScans.length }} из {{ scans.length }}
			</div>
		</header>

		<!-- Main -->
		<main class="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] max-w-screen-sm mx-auto">
			<!-- Empty -->
			<div
				v-if="scans.length === 0"
				class="text-center py-14"
			>
				<div class="w-20 h-20 bg-slate-100 rounded-full grid place-items-center mx-auto mb-5">
					<History class="w-10 h-10 text-slate-400" />
				</div>
				<h3 class="text-lg font-semibold mb-1">Нет сканирований</h3>
				<p class="text-slate-600 mb-5 text-sm">Начните сканирование, чтобы увидеть историю.</p>
				<RouterLink
					:to="{ name: 'scan' }"
					class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
				>
					<Camera class="w-5 h-5" />
					Первое сканирование
				</RouterLink>
			</div>

			<!-- List -->
			<div
				v-else
				class="space-y-4"
			>
				<button
					v-for="scan in filteredScans"
					:key="scan.id"
					class="w-full text-left rounded-2xl bg-white/70 backdrop-blur border border-slate-200 hover:bg-white active:opacity-95 transition"
					@click="openScanDetails(scan.id)"
				>
					<div class="p-4">
						<!-- Title = date -->
						<div class="flex items-start justify-between gap-3 mb-2">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="text-base sm:text-lg font-semibold truncate">
										{{ formatDate(scan.createdAt) }}
									</h3>
									<span
										:class="['px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', overallClass(scan)]"
									>
										{{ overallLabel(scan) }}
									</span>
								</div>
								<div
									class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-slate-600"
								>
									<span class="flex items-center gap-1 min-w-0">
										<Car class="w-4 h-4" />
										<span class="truncate">{{ scan.carModel }}</span>
									</span>
									<span class="flex items-center gap-1">
										<MapPin class="w-4 h-4" /> {{ scan.location }}
									</span>
								</div>
							</div>

							<div class="text-right shrink-0">
								<p class="text-[11px] text-slate-500">Ремонт</p>
								<p class="text-sm font-semibold">{{ formatCurrency(scan.estimatedCost) }}</p>
							</div>
						</div>

						<!-- Zones -->
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
							<div
								v-for="zone in scan.zones"
								:key="zone.name"
								class="rounded-xl border border-slate-200 bg-white/60 p-2"
							>
								<p class="text-[12px] font-medium text-slate-800 mb-1">{{ zone.name }}</p>
								<div class="flex flex-wrap items-center gap-1.5">
									<!-- breaking -->
									<span
										:class="[
                      'px-1.5 py-0.5 rounded-md text-[11px] font-medium border',
                      zone.breaking ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    ]"
										title="Поломка"
									>
										Поломка: {{ zone.breaking ? 'Да' : 'Нет' }}
									</span>
									<!-- rust -->
									<span
										:class="[
                      'px-1.5 py-0.5 rounded-md text-[11px] font-medium border',
                      zone.hasRust ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    ]"
										title="Ржавчина"
									>
										Ржа: {{ zone.hasRust ? 'Да' : 'Нет' }}
									</span>
									<!-- dirty -->
									<span
										:class="[
                      'px-1.5 py-0.5 rounded-md text-[11px] font-medium border',
                      zone.isDirty ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    ]"
										title="Грязь"
									>
										Грязь: {{ zone.isDirty ? 'Да' : 'Нет' }}
									</span>
								</div>
							</div>
						</div>

						<!-- Arrow -->
						<div class="mt-3 flex justify-end">
							<ChevronRight class="w-5 h-5 text-slate-400" />
						</div>
					</div>
				</button>
			</div>
		</main>

		<TabBar />
	</div>
</template>

<script setup lang="ts">
import { ArrowUpDown, Camera, Car, ChevronRight, History, MapPin, Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';



import TabBar from '@/core/layouts/primary/primary-tabbar.vue';





type ZoneRow = { name: 'Передняя' | 'Левая' | 'Правая' | 'Задняя'; breaking: boolean; hasRust: boolean; isDirty: boolean }
type ScanRow = { id: string; carModel: string; location: string; createdAt: Date; estimatedCost: number; zones: ZoneRow[] }

const router = useRouter()

// Segmented filters
const FILTERS = [
  { value: 'all',       label: 'Все' },
  { value: 'withBreak', label: 'С поломками' },
  { value: 'noBreak',   label: 'Без поломок' }
] as const
type FilterVal = typeof FILTERS[number]['value']

const selectedFilter = ref<FilterVal>('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

// Demo data
const scans = ref<ScanRow[]>([
  {
    id: 'scan_001',
    carModel: 'Toyota Camry 2019',
    location: 'Алматы',
    createdAt: new Date('2025-09-12T14:30:00'),
    estimatedCost: 850_000,
    zones: [
      { name: 'Передняя', breaking: true,  hasRust: true,  isDirty: true  },
      { name: 'Левая',    breaking: false, hasRust: false, isDirty: false },
      { name: 'Правая',   breaking: true,  hasRust: false, isDirty: true  },
      { name: 'Задняя',   breaking: false, hasRust: false, isDirty: true  }
    ]
  },
  {
    id: 'scan_002',
    carModel: 'Honda CR-V 2021',
    location: 'Алматы',
    createdAt: new Date('2025-09-10T09:15:00'),
    estimatedCost: 320_000,
    zones: [
      { name: 'Передняя', breaking: false, hasRust: false, isDirty: true  },
      { name: 'Левая',    breaking: false, hasRust: false, isDirty: false },
      { name: 'Правая',   breaking: false, hasRust: false, isDirty: false },
      { name: 'Задняя',   breaking: false, hasRust: false, isDirty: false }
    ]
  },
  {
    id: 'scan_003',
    carModel: 'BMW X5 2018',
    location: 'Астана',
    createdAt: new Date('2025-09-05T16:45:00'),
    estimatedCost: 1_200_000,
    zones: [
      { name: 'Передняя', breaking: false, hasRust: false, isDirty: true  },
      { name: 'Левая',    breaking: false, hasRust: false, isDirty: false },
      { name: 'Правая',   breaking: true,  hasRust: true,  isDirty: false },
      { name: 'Задняя',   breaking: false, hasRust: false, isDirty: false }
    ]
  }
])

// Helpers
const hasAnyBreaking = (s: ScanRow) => s.zones.some(z => z.breaking)
const overallLabel = (s: ScanRow) => (hasAnyBreaking(s) ? 'Есть поломки' : s.zones.some(z => z.hasRust || z.isDirty) ? 'Только обслуживание' : 'Без проблем')
const overallClass = (s: ScanRow) => (hasAnyBreaking(s) ? 'bg-red-100 text-red-800' : s.zones.some(z => z.hasRust || z.isDirty) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')

// Filter + sort
const filteredScans = computed(() => {
  let data = scans.value
  if (selectedFilter.value === 'withBreak') data = data.filter(hasAnyBreaking)
  if (selectedFilter.value === 'noBreak')   data = data.filter(s => !hasAnyBreaking(s))
  return data
    .slice()
    .sort((a, b) =>
      sortOrder.value === 'desc'
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime()
    )
})

// Actions
const toggleSortOrder = () => (sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc')
const openScanDetails = (id: string) => router.push({ name: 'scan-details', params: { id } })

// Formatters
const formatDate = (d: Date) =>
  d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '')
const formatCurrency = (v: number) => new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)
</script>
