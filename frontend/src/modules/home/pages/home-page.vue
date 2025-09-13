<template>
	<div
		class="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 overflow-hidden"
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
				<div>
					<p class="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-medium">Главная</p>
					<h1 class="mt-0.5 text-2xl font-semibold tracking-tight">Altiv</h1>
				</div>

				<button
					class="px-4 py-1.5 rounded-2xl bg-white/70 border border-slate-200 text-slate-900 text-sm font-medium hover:bg-white transition-colors"
					@click="onChangeCity"
				>
					{{ city }}
				</button>
			</div>
		</header>

		<!-- Main -->
		<main class="relative z-10 px-6 space-y-6 pb-32">
			<!-- Readiness Card -->
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

				<!-- Actions -->
				<div class="flex gap-3">
					<RouterLink
						:to="{ name: 'scan' }"
						class="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition-colors py-3.5 px-6 text-white"
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

			<!-- Car Zones -->
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
						v-for="zone in zones"
						:key="zone.key"
						class="flex items-center justify-between py-4"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-0.5">
								<h4 class="text-base font-semibold truncate">{{ zone.title }}</h4>
								<span
									:class="`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${getBreakingColor(zone.breaking)}`"
								>
									{{ getBreakingText(zone.breaking) }}
								</span>
							</div>
							<p class="text-sm text-slate-600 truncate">{{ zone.note }}</p>

							<!-- Indicators -->
							<div class="flex items-center gap-2 mt-2">
								<span
									v-if="zone.dirty"
									class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-medium border border-amber-200"
								>
									Грязь
								</span>
								<span
									v-if="zone.rusted"
									class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-medium border border-red-200"
								>
									Ржавчина
								</span>
							</div>
						</div>

						<ChevronRight class="w-5 h-5 text-slate-400" />
					</div>
				</div>

				<!-- Quick actions -->
				<div class="flex gap-3 mt-6 pt-6 border-t border-slate-200">
					<RouterLink
						to="/advice"
						class="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/70 border border-slate-200 hover:bg-white transition-colors"
					>
						<Lightbulb class="w-4 h-4 text-emerald-600" />
						<span class="text-sm font-medium text-slate-900">Советы</span>
					</RouterLink>
					<RouterLink
						to="/ctos"
						class="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors text-white"
					>
						<MapPin class="w-4 h-4" />
						<span class="text-sm font-semibold">Найти СТО</span>
					</RouterLink>
				</div>
			</section>

			<!-- Privacy -->
			<section class="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-5">
				<div class="flex items-start gap-3">
					<Shield class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
					<div class="text-sm text-slate-700 leading-relaxed">
						<strong class="text-slate-900">Конфиденциально:</strong> фото обезличиваются
						автоматически. Данные удаляются через 72 часа.
					</div>
				</div>
			</section>
		</main>

		<TabBar />
	</div>
</template>

<script setup lang="ts">
import { Car, ChevronRight, Lightbulb, MapPin, ScanLine, Shield } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';



import TabBar from '@/core/layouts/primary/primary-tabbar.vue';



import ReadinessGauge from '../components/home-readiness-gauge.vue';





// State
const city = 'Алматы'
const lastScanId = 'scan_123'
const readiness = 82
const updatedRelative = '2 ч. назад'

// Zones (breaking 1–3, dirty bool, rusted bool)
const zones = [
  { key: 'front', title: 'Передняя', note: 'капот, бампер, фары', breaking: 2, dirty: true,  rusted: false },
  { key: 'left',  title: 'Левая',    note: 'двери, крылья',       breaking: 1, dirty: false, rusted: false },
  { key: 'right', title: 'Правая',   note: 'двери, крылья',       breaking: 3, dirty: true,  rusted: true  },
  { key: 'back',  title: 'Задняя',   note: 'багажник, бампер',    breaking: 1, dirty: false, rusted: false }
]

// Gauge tone (kept as 'primary' for component API; visual emerald used elsewhere)
const gaugeTone = computed<'primary' | 'amber' | 'red'>(() =>
  readiness >= 80 ? 'primary' : readiness >= 60 ? 'amber' : 'red'
)

const readinessStatus = computed(() => {
  if (readiness >= 80) return { text: 'Отличное состояние', color: 'text-emerald-600' }
  if (readiness >= 60) return { text: 'Требует внимания',   color: 'text-amber-600' }
  return { text: 'Критическое состояние', color: 'text-red-600' }
})

const getBreakingColor = (b: number): string => {
  switch (b) {
    case 3: return 'bg-red-600'
    case 2: return 'bg-amber-500'
    case 1: return 'bg-emerald-600'
    default: return 'bg-emerald-600'
  }
}
const getBreakingText = (b: number): string => (b === 3 ? 'Критично' : b === 2 ? 'Внимание' : 'Хорошо')

const onChangeCity = () => {
  // open city picker
}
</script>
