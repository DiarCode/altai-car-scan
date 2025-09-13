<!-- ScanHistory.vue -->
<template>
	<div class="min-h-screen bg-gradient-to-b from-slate-100 to-slate-100 text-slate-900">
		<!-- Sticky header -->
		<div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
			<div class="px-6 py-4 max-w-screen-sm mx-auto">
				<div class="flex items-center justify-between gap-3 mb-5">
					<div class="min-w-0">
						<h1 class="text-2xl font-bold tracking-tight">История сканирований</h1>
					</div>

					<div class="flex gap-2 shrink-0">
						<Button
							variant="secondary"
							size="icon"
							class="h-10 w-10"
							aria-label="Сортировать"
							@click="toggleSortOrder"
						>
							<ArrowUpDown class="w-5 h-5" />
						</Button>
					</div>
				</div>

				<!-- Filter tabs (segmented) -->
				<Tabs v-model="selectedFilter">
					<TabsList class="grid grid-cols-3 w-full bg-slate-100 rounded-xl h-12">
						<TabsTrigger
							v-for="f in FILTERS"
							:key="f.value"
							:value="f.value"
							class="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-lg text-sm font-medium transition"
						>
							<component
								:is="f.icon"
								class="w-4 h-4 mr-1.5"
							/>
							{{ f.label }}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
		</div>

		<!-- Content -->
		<div class="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] max-w-screen-sm mx-auto">
			<!-- Empty state -->
			<Card
				v-if="scans.length === 0"
				class="text-center"
			>
				<CardContent>
					<div class="w-20 h-20 bg-slate-100 rounded-full grid place-items-center mx-auto mb-5">
						<History class="w-10 h-10 text-slate-400" />
					</div>
					<h3 class="text-lg font-semibold mb-1">Нет сканирований</h3>
					<p class="text-slate-600 mb-5 text-sm">Начните сканирование, чтобы увидеть историю.</p>
					<Button
						class="bg-primary hover:bg-primary text-white"
						@click="goScan"
					>
						<Camera class="w-5 h-5 mr-2" /> Первое сканирование
					</Button>
				</CardContent>
			</Card>

			<!-- List -->
			<div
				v-else
				class="space-y-2"
			>
				<Card
					v-for="scan in filteredScans"
					:key="scan.id"
					class="hover:bg-white/90 transition cursor-pointer"
					@click="openScanDetails(scan.id)"
				>
					<CardContent>
						<!-- Header -->
						<div class="flex items-start justify-between mb-3 gap-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<Calendar class="w-4 h-4 text-slate-400" />
									<span class="font-semibold truncate">{{ formatDate(scan.createdAt) }}</span>
								</div>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-600">
									<span class="flex items-center gap-1 min-w-0">
										<Car class="w-4 h-4" />
										<span class="truncate">{{ scan.carModel }}</span>
									</span>
									<span class="flex items-center gap-1">
										<MapPin class="w-4 h-4" /> {{ scan.location }}
									</span>
								</div>
							</div>
							<ChevronRight class="w-5 h-5 text-slate-400 shrink-0" />
						</div>

						<!-- Status + cost -->
						<div class="flex items-center justify-between">
							<p class="font-bold text-slate-900">{{ formatCurrency(scan.estimatedCost) }}</p>

							<div
								class="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border"
								:class="statusColorClass(getStatusInfo(scan).severity)"
							>
								<component
									:is="getStatusInfo(scan).icon"
									class="w-4 h-4"
								/>
								{{ getStatusInfo(scan).label }}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>

		<PrimaryTabbar />
	</div>
</template>

<script setup lang="ts">
/* shadcn-vue components */
import { AlertTriangle, ArrowUpDown, Calendar, Camera, Car, CheckCircle, ChevronRight, History, MapPin, Wrench } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';



import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import PrimaryTabbar from "@/core/layouts/primary/primary-tabbar.vue";





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
  zones: ZoneRow[]
}

const FILTERS = [
  { value: 'all',       label: 'Все',      icon: History },
  { value: 'withBreak', label: 'Поломки',  icon: AlertTriangle },
  { value: 'noBreak',   label: 'Норма',    icon: CheckCircle }
] as const
type FilterVal = typeof FILTERS[number]['value']

const router = useRouter()

/* state */
const selectedFilter = ref<FilterVal>('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

/* demo data */
const scans = ref<ScanRow[]>([
  {
    id: 'scan_001',
    carModel: 'Toyota Camry 2019',
    location: 'Алматы',
    createdAt: new Date('2025-09-12T14:30:00'),
    estimatedCost: 850000,
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
    estimatedCost: 320000,
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
    estimatedCost: 1200000,
    zones: [
      { name: 'Передняя', breaking: false, hasRust: false, isDirty: true  },
      { name: 'Левая',    breaking: false, hasRust: false, isDirty: false },
      { name: 'Правая',   breaking: true,  hasRust: true,  isDirty: false },
      { name: 'Задняя',   breaking: false, hasRust: false, isDirty: false }
    ]
  }
])

/* helpers */
const hasAnyBreaking = (s: ScanRow) => s.zones.some(z => z.breaking)
const hasOnlyMaintenance = (s: ScanRow) => !hasAnyBreaking(s) && s.zones.some(z => z.hasRust || z.isDirty)

const getStatusInfo = (s: ScanRow) => {
  if (hasAnyBreaking(s)) {
    return { label: 'Требует ремонта', severity: 'high' as const, icon: AlertTriangle }
  }
  if (hasOnlyMaintenance(s)) {
    return { label: 'Обслуживание', severity: 'medium' as const, icon: Wrench }
  }
  return { label: 'Отлично', severity: 'low' as const, icon: CheckCircle }
}

const statusColorClass = (sev: 'high' | 'medium' | 'low') =>
  sev === 'high'
    ? 'bg-red-50 text-red-700 border-red-200'
    : sev === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-primary-50 text-primary border-primary'

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

const formatDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)

/* actions */
const toggleSortOrder = () => (sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc')
const goScan = () => router.push({ name: 'scan' })
const openScanDetails = (id: string) => router.push({ name: 'analysis-details', params: { id } })
</script>
