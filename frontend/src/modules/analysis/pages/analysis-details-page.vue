<!-- ScanDetails.vue -->
<template>
	<div class="min-h-screen bg-slate-100 text-slate-900">
		<!-- Sticky header -->
		<div class="sticky top-0 z-30 bg-white/60 backdrop-blur-md border-b border-slate-200">
			<div class="px-6 py-4 max-w-screen-sm mx-auto">
				<Button
					variant="ghost"
					class="h-9 px-2 text-slate-700 hover:bg-slate-100 mb-3"
					@click="goBack"
				>
					<ArrowLeft class="w-5 h-5 mr-1" />
					Назад к истории
				</Button>

				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<Calendar class="w-5 h-5 text-slate-400" />
							<h1 class="text-xl font-bold truncate">
								{{ formatDate(scanData.createdAt) }}
							</h1>
						</div>
						<div class="flex flex-col gap-1 text-sm text-slate-600">
							<span class="flex items-center gap-2 min-w-0">
								<Car class="w-4 h-4" />
								<span class="truncate">{{ scanData.carModel }}</span>
							</span>
							<span class="flex items-center gap-2">
								<MapPin class="w-4 h-4" />
								{{ scanData.location }}
							</span>
						</div>
					</div>

					<div class="text-right shrink-0">
						<p class="text-xs text-slate-500">Общая стоимость</p>
						<p class="text-2xl font-bold text-slate-900">
							{{ formatCurrency(scanData.totalEstimatedCost) }}
						</p>
						<p :class="['text-sm font-medium', riskColor(scanData.overallAnalysis.riskLevel)]">
							Уровень риска:
							{{ scanData.overallAnalysis.riskLevel === 'high'
                  ? 'Высокий' : scanData.overallAnalysis.riskLevel === 'medium'
                  ? 'Средний' : 'Низкий' }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<Tabs
			v-model="activeTab"
			class="mt-5 px-4"
		>
			<TabsList class="grid grid-cols-2 w-full bg-slate-200 h-12 rounded-lg">
				<TabsTrigger
					value="analysis"
					class="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md"
				>
					Анализ по зонам
				</TabsTrigger>
				<TabsTrigger
					value="summary"
					class="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md"
				>
					Общий анализ
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
									<div
										v-if="zone.breaking || zone.hasRust || zone.isDirty"
										class="space-y-2"
									>
										<h4 class="font-medium">Обнаруженные проблемы:</h4>
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
									<div class="flex items-start gap-2">
										<Info class="w-5 h-5 text-primary mt-0.5" />
										<div>
											<h4 class="font-medium mb-1">Важность устранения</h4>
											<p class="text-sm text-slate-700">
												{{ zone.aiAnalysis.importance }}
											</p>
										</div>
									</div>

									<Card
										v-if="zone.aiAnalysis.consequences.length"
										class="border-amber-200 bg-amber-50"
									>
										<CardContent>
											<div class="flex items-start gap-2">
												<AlertTriangle class="w-5 h-5 text-amber-600 mt-0.5" />
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
											</div>
										</CardContent>
									</Card>

									<!-- Cost / Time -->
									<div class="grid grid-cols-2 gap-3">
										<Card class="border-primary bg-primary-50">
											<CardContent>
												<div class="flex items-center gap-2 mb-1">
													<DollarSign class="w-4 h-4 text-primary" />
													<span class="font-medium text-primary">Стоимость</span>
												</div>
												<p class="text-lg font-bold text-primary">
													{{ zone.aiAnalysis.estimatedCost > 0 ? formatCurrency(zone.aiAnalysis.estimatedCost) : 'Бесплатно' }}
												</p>
											</CardContent>
										</Card>
										<Card class="border-violet-200 bg-violet-50">
											<CardContent>
												<div class="flex items-center gap-2 mb-1">
													<Clock class="w-4 h-4 text-violet-600" />
													<span class="font-medium text-violet-900">Время</span>
												</div>
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
						<!-- Summary card -->
						<Card class="bg-white">
							<CardContent>
								<div class="flex items-center gap-3 mb-4">
									<div class="p-3 bg-primary rounded-lg">
										<Shield class="w-6 h-6 text-primary" />
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
									<div class="flex items-center gap-2 mb-2">
										<TrendingUp class="w-5 h-5 text-primary" />
										<span class="font-medium">Проблемных зон</span>
									</div>
									<p class="text-2xl font-bold">{{ activeZones.length }}</p>
									<p class="text-sm text-slate-600">из {{ scanData.zones.length }} проверенных</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<div class="flex items-center gap-2 mb-2">
										<Clock class="w-5 h-5 text-violet-600" />
										<span class="font-medium">Время ремонта</span>
									</div>
									<p class="text-2xl font-bold">
										{{ scanData.overallAnalysis.totalTimeEstimate }}
									</p>
									<p class="text-sm text-slate-600">примерная оценка</p>
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
import { AlertTriangle, ArrowLeft, Calendar, Car, CheckCircle, Clock, DollarSign, Info, MapPin, Shield, TrendingUp, Wrench, Zap } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';



import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { Badge } from '@/core/components/ui/badge';
/* shadcn-vue */
import { Button } from '@/core/components/ui/button';
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
const activeTab = ref<'analysis' | 'summary'>('analysis')
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


const riskColor = (r: Risk) => (r === 'high' ? 'text-red-600' : r === 'medium' ? 'text-amber-600' : 'text-primary')

const getZoneStatus = (z: ZoneAnalysis) => {
  if (z.breaking) return { label: 'Поломка', colorBox: 'border-red-200 text-red-700', icon: AlertTriangle }
  if (z.hasRust || z.isDirty) return { label: 'Обслуживание', colorBox: 'border-amber-200 text-amber-700', icon: Wrench }
  return { label: 'Отлично', colorBox: 'border-green-500 text-green-500', icon: CheckCircle }
}
</script>
