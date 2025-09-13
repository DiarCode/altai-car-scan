// router/index.ts
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'welcome',
		component: () => import('@/modules/welcome/pages/welcome-page.vue'),
		meta: {
			title: 'CarScan - Добро пожаловать',
			description: 'Добро пожаловать в CarScan - ваш надежный помощник в диагностике автомобилей.',
			layout: 'blank',
		},
	},
	{
		path: '/app/home',
		name: 'home',
		component: () => import('@/modules/home/pages/home-page.vue'),
		meta: {
			title: 'CarScan - Главная',
			description: 'Главная страница приложения CarScan.',
			layout: 'blank',
		},
	},
	{
		path: '/app/scan',
		name: 'scan',
		component: () => import('@/modules/scan/scan-page.vue'),
		meta: {
			title: 'CarScan - Сканирование',
			description: 'Страница сканирования автомобиля.',
			layout: 'blank',
		},
	},

	{
		path: '/app/profile',
		name: 'profile',
		component: () => import('@/modules/home/pages/home-page.vue'),
		meta: {
			title: 'CarScan - Профиль',
			description: 'Страница профиля пользователя.',
			layout: 'blank',
		},
	},

	{
		path: '/app/analysis',
		name: 'analysis',
		component: () => import('@/modules/analysis/pages/analysis-list-page.vue'),
		meta: {
			title: 'CarScan - Результаты',
			description: 'Страница результатов сканирования.',
			layout: 'blank',
		},
	},

	{
		path: '/app/analysis/:id',
		name: 'analysis-details',
		component: () => import('@/modules/analysis/pages/analysis-details-page.vue'),
		meta: {
			title: 'CarScan - Результаты',
			description: 'Страница результатов сканирования.',
			layout: 'blank',
		},
	},
]

// Create router instance
export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior(to) {
		if (to.hash) {
			return {
				el: to.hash,
				behavior: 'smooth',
			}
		}
		return { top: 0, behavior: 'smooth' }
	},
	routes,
})
