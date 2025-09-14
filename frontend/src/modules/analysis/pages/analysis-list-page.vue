<!-- ScanHistory.vue -->
<template>
	<div class="bg-gradient-to-b from-slate-100 to-slate-100 min-h-screen text-slate-900">
		<!-- Sticky header -->
		<div class="top-0 z-30 sticky bg-white/80 backdrop-blur-md border-slate-200 border-b">
			<div class="mx-auto px-6 py-4 max-w-screen-sm">
				<div class="flex justify-between items-center gap-3 mb-5">
					<div class="min-w-0">
						<h1 class="font-bold text-2xl tracking-tight">История сканирований</h1>
					</div>

					<div class="flex gap-2 shrink-0">
						<Button
							variant="secondary"
							size="icon"
							class="w-10 h-10"
							aria-label="Сортировать"
							@click="toggleSortOrder"
						>
							<ArrowUpDown class="w-5 h-5" />
						</Button>
					</div>
				</div>

				<!-- Filter tabs (segmented) -->
				<Tabs v-model="selectedFilter">
					<TabsList class="grid grid-cols-3 bg-slate-100 rounded-xl w-full h-12">
						<TabsTrigger
							v-for="f in FILTERS"
							:key="f.value"
							:value="f.value"
							class="data-[state=active]:bg-white rounded-lg font-medium data-[state=active]:text-slate-900 text-sm transition"
						>
							<component
								:is="f.icon"
								class="mr-1.5 w-4 h-4"
							/>
							{{ f.label }}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
		</div>

		<!-- Content -->
		<div class="pb-[calc(env(safe-area-inset-bottom)+5.5rem)] mx-auto px-4 py-4 max-w-screen-sm">
			<!-- Error (non-404) -->
			<Card v-if="isError && !isEmpty">
				<CardContent class="py-5">
					<p class="text-red-600 text-sm">Не удалось загрузить список. Попробуйте ещё раз.</p>
					<div class="mt-3">
						<Button
							variant="secondary"
							@click="refetch"
							>Обновить</Button
						>
					</div>
				</CardContent>
			</Card>

			<!-- Empty state -->
			<Card
				v-else-if="!isLoading && isEmpty"
				class="text-center"
			>
				<CardContent>
					<div class="place-items-center grid bg-slate-100 mx-auto mb-5 rounded-full w-20 h-20">
						<History class="w-10 h-10 text-slate-400" />
					</div>
					<h3 class="mb-1 font-semibold text-lg">Нет сканирований</h3>
					<p class="mb-5 text-slate-600 text-sm">Начните сканирование, чтобы увидеть историю.</p>
					<Button
						class="bg-primary hover:bg-primary text-primary-foreground"
						@click="goScan"
					>
						<Camera class="mr-2 w-5 h-5" /> Первое сканирование
					</Button>
				</CardContent>
			</Card>

			<!-- Loading skeletons -->
			<div
				v-else-if="isLoading"
				class="space-y-2"
			>
				<Card
					v-for="i in 4"
					:key="i"
				>
					<CardContent class="py-4">
						<div class="flex justify-between items-start gap-3 mb-3">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									<Skeleton class="w-40 h-4" />
								</div>
								<div class="flex gap-3">
									<Skeleton class="w-44 h-4" />
									<Skeleton class="w-24 h-4" />
								</div>
							</div>
							<Skeleton class="rounded-md w-5 h-5" />
						</div>
						<div class="flex justify-between items-center">
							<Skeleton class="w-32 h-5" />
							<Skeleton class="rounded-full w-40 h-7" />
						</div>
					</CardContent>
				</Card>
			</div>

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
						<div class="flex justify-between items-start gap-3 mb-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<Calendar class="w-4 h-4 text-slate-400" />
									<span class="font-semibold truncate">
										{{ formatDate(scan.createdAt) }}
									</span>
								</div>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-600 text-sm">
									<span class="flex items-center gap-1 min-w-0">
										<Car class="w-4 h-4" />
										<span class="truncate">{{ scan.carModel }} ({{ scan.carYear }})</span>
									</span>
									<span class="flex items-center gap-1">
										<MapPin class="w-4 h-4" /> {{ scan.city }}
									</span>
								</div>
							</div>
							<ChevronRight class="w-5 h-5 text-slate-400 shrink-0" />
						</div>

						<!-- Status + cost -->
						<div class="flex justify-between items-center">
							<p class="font-bold text-slate-900">
								{{ formatCurrency(scan.totalEstimatedCost) }}
							</p>

							<div
								class="flex items-center gap-2 px-3 py-1 border rounded-full font-medium text-sm"
								:class="statusColorClass(statusSeverity(scan))"
							>
								<component
									:is="statusIcon(scan)"
									class="w-4 h-4"
								/>
								{{ statusLabel(scan) }}
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
/* icons & vue */
import { AlertTriangle, ArrowUpDown, Calendar, Camera, Car, CheckCircle, ChevronRight, History, MapPin, Wrench } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';



/* shadcn-vue */
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import PrimaryTabbar from '@/core/layouts/primary/primary-tabbar.vue';



/* data: composable (list) */
import { useAnalysesList } from '@/modules/analysis/composables/analysis.composables';
import { type CarAnalysisDto, CarStatus } from '@/modules/analysis/models/analysis.models';





/* filters */
const FILTERS = [
  { value: 'all',       label: 'Все',      icon: History },
  { value: 'withBreak', label: 'Поломки',  icon: AlertTriangle },
  { value: 'noBreak',   label: 'Норма',    icon: CheckCircle }
] as const
type FilterVal = typeof FILTERS[number]['value']

/* router */
const router = useRouter()

/* state */
const selectedFilter = ref<FilterVal>('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

/* fetch list */
const { data, isLoading, isError, refetch } = useAnalysesList()
const analyses = computed<CarAnalysisDto[]>(() => data.value ?? [])

/* empty when loaded and no items, or 404 */
const isEmpty = computed(() => !isLoading.value && analyses.value.length === 0)

/* helpers derived from zones */
const hasAnyBreaking = (a: CarAnalysisDto) => (a.zones ?? []).some(z => z.breaking)
const hasOnlyMaintenance = (a: CarAnalysisDto) =>
  !hasAnyBreaking(a) && (a.zones ?? []).some(z => z.hasRust || z.isDirty)

/* status rendering (prefer server status; fallback to zones) */
const statusSeverity = (a: CarAnalysisDto) => {
  if (a.status === CarStatus.CRITICAL_CONDITION) return 'high' as const
  if (a.status === CarStatus.MECHANICAL_SERVICE_NEEDED || a.status === CarStatus.COSMETIC_ISSUES) return 'medium' as const
  if (a.status === CarStatus.EXCELLENT) return 'low' as const
  // fallback:
  if (hasAnyBreaking(a)) return 'high'
  if (hasOnlyMaintenance(a)) return 'medium'
  return 'low'
}
const statusLabel = (a: CarAnalysisDto) => {
  if (a.status === CarStatus.CRITICAL_CONDITION) return 'Требует ремонта'
  if (a.status === CarStatus.MECHANICAL_SERVICE_NEEDED || a.status === CarStatus.COSMETIC_ISSUES) return 'Обслуживание'
  if (a.status === CarStatus.EXCELLENT) return 'Отлично'
  return hasAnyBreaking(a) ? 'Требует ремонта' : hasOnlyMaintenance(a) ? 'Обслуживание' : 'Отлично'
}
const statusIcon = (a: CarAnalysisDto) => {
  const sev = statusSeverity(a)
  return sev === 'high' ? AlertTriangle : sev === 'medium' ? Wrench : CheckCircle
}
const statusColorClass = (sev: 'high' | 'medium' | 'low') =>
  sev === 'high'
    ? 'bg-red-50 text-red-700 border-red-200'
    : sev === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

/* filter + sort */
const filteredScans = computed(() => {
  let data = analyses.value.slice()
  if (selectedFilter.value === 'withBreak') data = data.filter(hasAnyBreaking)
  if (selectedFilter.value === 'noBreak')   data = data.filter(a => !hasAnyBreaking(a))

  return data.sort((a, b) => {
    const da = new Date(a.createdAt).getTime()
    const db = new Date(b.createdAt).getTime()
    return sortOrder.value === 'desc' ? db - da : da - db
  })
})

/* formatters */
const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v)

/* actions */
const toggleSortOrder = () => (sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc')
const goScan = () => router.push({ name: 'scan' })
const openScanDetails = (id: number) => router.push({ name: 'analysis-details', params: { id } })
</script>
