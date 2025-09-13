<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToRegister = () => {
	router.push('/auth/register')
}

const goToLogin = () => {
	router.push('/auth/login')
}
</script>

<template>
	<div class="min-h-screen bg-white flex flex-col">
		<!-- Main Content -->
		<div class="flex-1 flex flex-col items-center justify-center px-6 py-8">
			<!-- Logo/Brand Section -->
			<div class="text-center mb-12">
				<div class="w-24 h-24 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
					<svg 
						class="w-12 h-12 text-primary-foreground" 
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path 
							stroke-linecap="round" 
							stroke-linejoin="round" 
							stroke-width="2" 
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-foreground mb-2">
					CarScan
				</h1>
				<p class="text-lg text-muted-foreground max-w-sm mx-auto">
					Ваш надежный помощник в диагностике автомобилей
				</p>
			</div>
			
			<!-- Features Section -->
			<div class="grid grid-cols-1 gap-4 w-full max-w-sm mb-12">
				<div class="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border shadow-sm">
					<div class="w-8 h-8 bg-primary/70 rounded-full flex items-center justify-center border border-primary-foreground/10">
						<svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<span class="text-sm text-foreground">Сканирование фото автомобиля</span>
				</div>
				
				<div class="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border shadow-sm">
					<div class="w-8 h-8 bg-primary/70 rounded-full flex items-center justify-center border border-primary-foreground/10">
						<svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
						</svg>
					</div>
					<span class="text-sm text-foreground">Детальные отчеты о состоянии</span>
				</div>
				
				<div class="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border shadow-sm">
					<div class="w-8 h-8 bg-primary/70 rounded-full flex items-center justify-center border border-primary-foreground/10">
						<svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
						</svg>
					</div>
					<span class="text-sm text-foreground">Быстрая оценка стоимости</span>
				</div>
			</div>
		</div>
		
		<!-- Bottom Actions -->
		<div class="px-6 pb-8 space-y-4 flex flex-col items-center">
			<button
				class="max-w-xl w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
				@click="goToRegister"
			>
				Зарегистрироваться
			</button>
			
			<button
				class="max-w-xl w-full border-2 border-border bg-transparent text-foreground font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-95 focus:outline-none focus:ring-2 focus:ring-border/50 focus:ring-offset-2"
				@click="goToLogin"
			>
				Войти
			</button>
		</div>
	</div>
</template>

<style scoped>
/* Additional mobile optimizations */
@media (max-width: 375px) {
	.grid {
		gap: 0.75rem;
	}
}
</style>
