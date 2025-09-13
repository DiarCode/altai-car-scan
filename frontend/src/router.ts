// router/index.ts
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		redirect: '/welcome'
	},
	{
		path: '/welcome',
		name: 'welcome',
		component: () => import('@/modules/welcome/pages/welcome-page.vue'),
		meta: {
			title: 'CarScan - Добро пожаловать',
			description: 'Добро пожаловать в CarScan - ваш надежный помощник в диагностике автомобилей.',
			layout: 'blank',
		},
	},
	{
		path: '/auth/login',
		name: 'login',
		component: () => import('@/modules/auth/pages/login-page.vue'),
		meta: {
			title: 'CarScan - Вход',
			description: 'Войдите в ваш аккаунт CarScan',
			layout: 'blank',
		},
	},
	{
		path: '/auth/register',
		name: 'register',
		component: () => import('@/modules/auth/pages/register-page.vue'),
		meta: {
			title: 'CarScan - Регистрация',
			description: 'Создайте новый аккаунт CarScan',
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
