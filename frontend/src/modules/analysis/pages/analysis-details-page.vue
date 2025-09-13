<template>
	<div class="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-900">
		<!-- Header -->
		<header
			class="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 pt-12 pb-6"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-slate-500 uppercase tracking-wider font-medium">История</p>
					<h1 class="text-3xl font-bold text-slate-900 mt-1">Анализ сканирований</h1>
				</div>

				<div class="flex items-center gap-2">
					<button
						class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
						@click="toggleSortOrder"
						aria-label="Сортировать по дате"
					>
						<ArrowUpDown class="w-5 h-5 text-slate-600" />
					</button>
					<button
						class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
						@click="$router.push({ name: 'scan' })"
					>
						<Plus class="w-4 h-4 inline mr-2" />
						Новое сканирование
					</button>
				</div>
			</div>
		</header>

		<!-- Filters -->
		<div class="px-6 py-4 bg-white border-b border-slate-100">
			<div class="flex items-center gap-4">
				<select
					v-model="selectedFilter"
					class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:border-slate-300 transition-colors"
				>
					<option value="all">Все сканирования</option>
					<option value="withBreak">С поломками</option>
					<option value="noBreak">Без поломок</option>
				</select>

				<div class="text-sm text-slate-500">{{ filteredScans.length }} из {{ scans.length }}</div>
			</div>
		</div>

		<!-- Main Content -->
		<main class="px-6 py-8 pb-32">
			<div class="max-w-4xl mx-auto">
				<!-- Empty State -->
				<div
					v-if="scans.length === 0"
					class="text-center py-16"
				>
					<div
						class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
					>
						<History class="w-12 h-12 text-slate-400" />
					</div>
					<h3 class="text-xl font-semibold text-slate-900 mb-2">Нет сканирований</h3>
					<p class="text-slate-600 mb-6">
						Начните сканирование автомобиля, чтобы увидеть историю анализов
					</p>
					<RouterLink
						:to="{ name: 'scan' }"
						class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
					>
						<Camera class="w-5 h-5" />
						Первое сканирование
					</RouterLink>
				</div>

				<!-- Scans List -->
				<div
					v-else
					class="space-y-6"
				>
					<div
						v-for="scan in filteredScans"
						:key="scan.id"
						class="bg-white/70 backdrop-blur rounded-2xl border border-slate-200 hover:bg-white transition-colors cursor-pointer"
						@click="openScanDetails(scan.id)"
					>
						<div class="p-6">
							<!-- Header Row -->
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1 min-w-0">
									<!-- Title = analysis date -->
									<div class="flex items-center gap-3 mb-1">
										<h3 class="text-lg font-semibold text-slate-900 truncate">
											{{ formatDate(scan.createdAt) }}
										</h3>
										<span
											:class="['px-2.5 py-0.5 rounded-full text-xs font-medium', overallClass(scan)]"
										>
											{{ overallLabel(scan) }}
										</span>
									</div>

									<!-- Meta: car + location -->
									<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
										<span class="flex items-center gap-1 truncate">
											<Car class="w-4 h-4" />
											<span class="truncate">{{ scan.carModel }}</span>
										</span>
										<span class="flex items-center gap-1">
											<MapPin class="w-4 h-4" />
											{{ scan.location }}
										</span>
										<span
											v-if="scan.vin"
											class="hidden sm:inline text-slate-500"
											>VIN: {{ scan.vin }}</span
										>
									</div>
								</div>

								<!-- Estimated cost -->
								<div class="text-right shrink-0">
									<p class="text-xs text-slate-500">Оценка ремонта</p>
									<p class="text-sm font-semibold">{{ formatCurrency(scan.estimatedCost) }}</p>
								</div>
							</div>

							<!-- Zones Summary (breaking bool + rust + dirty) -->
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div
									v-for="zone in scan.zones"
									:key="zone.name"
									class="rounded-xl border border-slate-200 bg-white/60 p-3"
								>
									<p class="text-sm font-medium text-slate-800 mb-1">{{ zone.name }}</p>
									<div class="flex items-center gap-2">
										<!-- breaking -->
										<span
											:class="[
                        'px-2 py-0.5 rounded-md text-[11px] font-medium border',
                        zone.breaking ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      ]"
											title="Поломка"
										>
											Поломка: {{ zone.breaking ? 'Да' : 'Нет' }}
										</span>
										<!-- rust -->
										<span
											:class="[
                        'px-2 py-0.5 rounded-md text-[11px] font-medium border',
                        zone.hasRust ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      ]"
											title="Ржавчина"
										>
											Ржа: {{ zone.hasRust ? 'Да' : 'Нет' }}
										</span>
										<!-- dirty -->
										<span
											:class="[
                        'px-2 py-0.5 rounded-md text-[11px] font-medium border',
                        zone.isDirty ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      ]"
											title="Грязь"
										>
											Грязь: {{ zone.isDirty ? 'Да' : 'Нет' }}
										</span>
									</div>
								</div>
							</div>

							<!-- Footer arrow -->
							<div class="flex items-center justify-end mt-4">
								<ChevronRight class="w-5 h-5 text-slate-400" />
							</div>
						</div>
					</div>
				</div>
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





type ZoneRow = {
  name: 'Передняя' | 'Левая' | 'Правая' | 'Задняя'
  breaking: boolean
  hasRust: boolean
  isDirty: boolean
}
type ScanRow = {
  id: string
  carModel: string
  location: string
  createdAt: Date
  estimatedCost: number
  vin?: string
  zones: ZoneRow[]
}

// Router
const router = useRouter()

// Filter/sort
const selectedFilter = ref<'all' | 'withBreak' | 'noBreak'>('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

// Mock data (boolean breaking)
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

// Overall helpers
const hasAnyBreaking = (s: ScanRow) => s.zones.some(z => z.breaking)
const hasAnyIssue = (s: ScanRow) => s.zones.some(z => z.breaking || z.hasRust || z.isDirty)

const overallLabel = (s: ScanRow) => {
  if (hasAnyBreaking(s)) return 'Есть поломки'
  if (s.zones.some(z => z.hasRust || z.isDirty)) return 'Только обслуживание'
  return 'Без проблем'
}
const overallClass = (s: ScanRow) => {
  if (hasAnyBreaking(s)) return 'bg-red-100 text-red-800'
  if (s.zones.some(z => z.hasRust || z.isDirty)) return 'bg-amber-100 text-amber-800'
  return 'bg-emerald-100 text-emerald-800'
}

// Filtering + sorting
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
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}
const openScanDetails = (scanId: string) => {
  router.push({ name: 'scan-details', params: { id: scanId } })
}

// Formatters
const formatDate = (date: Date) =>
  date.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '')
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('kk-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
</script>
