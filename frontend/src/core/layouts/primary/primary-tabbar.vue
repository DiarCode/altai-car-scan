<template>
	<nav
		class="fixed bottom-0 inset-x-0 z-20"
		role="navigation"
		aria-label="Навигация по приложению"
	>
		<div class="bg-white/80 backdrop-blur-md border-t border-slate-200">
			<div
				class="flex justify-around items-center px-2 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
			>
				<RouterLink
					v-for="tab in tabs"
					:key="tab.name"
					:to="tab.route"
					:aria-current="isActiveTab(tab.name) ? 'page' : undefined"
					:class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-colors duration-200 min-w-0 flex-1',
            isActiveTab(tab.name)
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          ]"
				>
					<component
						:is="tab.icon"
						class="w-5 h-5 flex-shrink-0"
					/>
					<span class="text-[11px] font-medium truncate">{{ tab.label }}</span>
				</RouterLink>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { History, Home, ScanLine, User } from 'lucide-vue-next';
import { RouterLink, useRoute } from 'vue-router';





const route = useRoute()

// Tabs (history now links to its own route)
const tabs = [
  { name: 'home',    label: 'Главная',     icon: Home,     route: { name: 'home' } },
  { name: 'scan',    label: 'Сканировать', icon: ScanLine, route: { name: 'scan' } },
  { name: 'history', label: 'История',     icon: History,  route: { name: 'analysis' } },
  { name: 'profile', label: 'Профиль',     icon: User,     route: { name: 'profile' } }
]

// Active if exact or nested like 'history-item'
const isActiveTab = (tabName: string): boolean => {
  const current = String(route.name ?? '')
  return current === tabName || current.startsWith(`${tabName}-`)
}
</script>
