<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/use-auth.composable'
import { KAZAKHSTAN_CITIES } from '../constants/cities.constants'
import AppInput from '../components/app-input.vue'
import AppButton from '../components/app-button.vue'
import AppSelect from '../components/app-select.vue'

const router = useRouter()
const authState = useAuth()

const currentYear = new Date().getFullYear()

// City options for select
const cityOptions = computed(() => {
	return KAZAKHSTAN_CITIES.map(city => ({
		value: city,
		label: city
	}))
})

// Validation errors
const phoneError = computed(() => {
	if (!authState.registerState.phoneNumber) return undefined
	const digits = authState.registerState.phoneNumber.replace(/\D/g, '')
	// Should have exactly 11 digits for +7 format or 8 format
	return (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8')))
		? undefined 
		: 'Неверный формат номера телефона'
})

const nameError = computed(() => {
	if (!authState.registerState.name) return undefined
	return authState.registerState.name.trim().length < 2 
		? 'Имя должно содержать минимум 2 символа' 
		: undefined
})

const carModelError = computed(() => {
	if (!authState.registerState.carModel) return undefined
	return authState.registerState.carModel.trim().length < 2 
		? 'Модель должна содержать минимум 2 символа' 
		: undefined
})

const carYearError = computed(() => {
	const year = authState.registerState.carYear
	if (!year) return undefined
	return (year < 1990 || year > currentYear) 
		? `Год должен быть между 1990 и ${currentYear}` 
		: undefined
})

const carColorError = computed(() => {
	if (!authState.registerState.carColor) return undefined
	return authState.registerState.carColor.trim().length < 2 
		? 'Цвет должен содержать минимум 2 символа' 
		: undefined
})

const carVinError = computed(() => {
	if (!authState.registerState.carVin) return undefined
	const vin = authState.registerState.carVin.trim().toUpperCase()
	
	// VIN should be exactly 17 characters
	if (vin.length !== 17) {
		return 'VIN номер должен содержать ровно 17 символов'
	}
	
	// VIN should contain only alphanumeric characters (excluding I, O, Q)
	const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/
	if (!vinRegex.test(vin)) {
		return 'VIN номер содержит недопустимые символы'
	}
	
	return undefined
})

const cityError = computed(() => {
	if (!authState.registerState.city) return undefined
	return !KAZAKHSTAN_CITIES.some(city => city === authState.registerState.city)
		? 'Выберите город из списка' 
		: undefined
})

// Form validation
const isValidForm = computed(() => {
	return !phoneError.value && 
		   !nameError.value && 
		   !carModelError.value && 
		   !carYearError.value && 
		   !carColorError.value && 
		   !carVinError.value &&
		   !cityError.value &&
		   authState.registerState.phoneNumber &&
		   authState.registerState.name &&
		   authState.registerState.carModel &&
		   authState.registerState.carYear &&
		   authState.registerState.carColor &&
		   authState.registerState.carVin &&
		   authState.registerState.city
})

const formatRegisterPhone = (value: string) => {
	// Remove all non-digits first
	let cleanValue = value.replace(/\D/g, '')
	
	// Limit to maximum 11 digits
	cleanValue = cleanValue.slice(0, 11)
	
	// If starts with 8, replace with 7
	if (cleanValue.startsWith('8')) {
		cleanValue = '7' + cleanValue.slice(1)
	}
	
	// If starts with 7, add + prefix
	if (cleanValue.startsWith('7')) {
		return '+' + cleanValue
	} else if (cleanValue.length > 0) {
		// If user types any other number, assume they want Kazakhstan format
		return '+7' + cleanValue
	} else {
		return ''
	}
}

const handlePhoneInput = (value: string | number) => {
	const stringValue = String(value)
	const formatted = formatRegisterPhone(stringValue)
	authState.registerState.phoneNumber = formatted
}

const handleVinInput = (value: string | number) => {
	const stringValue = String(value).toUpperCase()
	authState.registerState.carVin = stringValue
}

const handleRegister = async () => {
	await authState.register()
}

const goBack = () => {
	router.push('/welcome')
}

const goToLogin = () => {
	router.push('/auth/login')
}

// Reset form when component mounts
onMounted(() => {
	authState.resetForm()
})
</script>

<template>
	<div class="min-h-screen bg-background flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-border">
			<button
				@click="goBack"
				class="p-2 hover:bg-accent rounded-lg transition-colors"
			>
				<svg class="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<h1 class="text-lg font-semibold text-foreground">Регистрация</h1>
			<div class="w-10"></div> <!-- Spacer -->
		</div>
		
		<!-- Content -->
		<div class="flex-1 px-6 py-8">
			<!-- Registration Form -->
			<div class="space-y-6">
				<div class="text-center">
					<h2 class="text-2xl font-bold text-foreground mb-2">
						Создать аккаунт
					</h2>
					<p class="text-muted-foreground">
						Заполните информацию для регистрации
					</p>
				</div>
				
				<form @submit.prevent="handleRegister" class="space-y-4">
					<!-- Personal Information -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-foreground border-b border-border pb-2">
							Личная информация
						</h3>
						
						<app-input
							:modelValue="authState.registerState.phoneNumber"
							@update:modelValue="handlePhoneInput"
							label="Номер телефона"
							placeholder="+7 (___) ___-__-__"
							type="tel"
							inputmode="tel"
							required
							:error="phoneError"
							hint="Формат: +7 или 8 с 10 цифрами (например: +77771234567)"
						/>
						
						<app-input
							v-model="authState.registerState.name"
							label="Полное имя"
							placeholder="Введите ваше имя"
							required
							:error="nameError"
						/>
					</div>
					
					<!-- Car Information -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-foreground border-b border-border pb-2">
							Информация об автомобиле
						</h3>
						
						<app-input
							v-model="authState.registerState.carModel"
							label="Марка и модель"
							placeholder="например, Toyota Camry"
							required
							:error="carModelError"
						/>
						
						<app-input
							v-model="authState.registerState.carYear"
							label="Год выпуска"
							type="number"
							inputmode="numeric"
							:min="1990"
							:max="currentYear"
							required
							:error="carYearError"
						/>
						
						<app-input
							v-model="authState.registerState.carColor"
							label="Цвет"
							placeholder="например, Белый"
							required
							:error="carColorError"
						/>
						
						<app-input
							:modelValue="authState.registerState.carVin"
							@update:modelValue="handleVinInput"
							label="VIN номер"
							placeholder="например, 1HGBH41JXMN109186"
							required
							:error="carVinError"
							hint="17-символьный уникальный номер автомобиля"
							:maxlength="17"
						/>
						
						<app-select
							v-model="authState.registerState.city"
							label="Город"
							:options="cityOptions"
							placeholder="Выберите город"
							required
							:error="cityError"
						/>
					</div>
					
					<div class="pt-4">
						<app-button
							type="submit"
							:loading="authState.isLoading.value"
							:disabled="!isValidForm"
							full-width
							size="lg"
						>
							Продолжить
						</app-button>
					</div>
				</form>
			</div>
			
			<!-- Info Section -->
			<div class="mt-8 p-4 bg-card rounded-lg border border-border">
				<div class="flex items-start space-x-3">
					<div class="w-8 h-8 bg-primary/70 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-foreground/10">
						<svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-medium text-foreground mb-1">
							После регистрации
						</h3>
						<p class="text-xs text-muted-foreground">
							Вы будете перенаправлены на страницу входа для авторизации
						</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="px-6 pb-6 text-center">
			<p class="text-sm text-muted-foreground">
				Уже есть аккаунт?
				<button @click="goToLogin" class="text-lime-600 hover:underline">
					Войти
				</button>
			</p>
		</div>
	</div>
</template>
