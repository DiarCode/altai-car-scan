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
