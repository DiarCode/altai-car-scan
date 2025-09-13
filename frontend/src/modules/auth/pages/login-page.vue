<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/use-auth.composable'
import AppInput from '../components/app-input.vue'
import AppButton from '../components/app-button.vue'
import OtpInput from '../components/otp-input.vue'

const router = useRouter()
const authState = useAuth()

const phoneNumber = ref('')
const resendTimer = ref(0)
let resendInterval: NodeJS.Timeout | null = null

const isValidPhone = computed(() => {
	const digits = phoneNumber.value.replace(/\D/g, '')
	// Should have exactly 11 digits for +7 format or 11 digits for 8 format
	return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))
})

const formatPhoneNumber = (value: string) => {
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
	const formatted = formatPhoneNumber(stringValue)
	phoneNumber.value = formatted
}

const handleLogin = async () => {
	await authState.login(phoneNumber.value)
	if (authState.loginState.step === 'otp') {
		startResendTimer()
	}
}

const handleOtpVerification = async () => {
	await authState.verifyOtp(authState.loginState.phoneNumber, authState.otpCode.value)
}

const handleOtpComplete = async (otp: string) => {
	if (otp.length === 4) {
		await authState.verifyOtp(authState.loginState.phoneNumber, otp)
	}
}

const resendCode = async () => {
	if (resendTimer.value > 0) return
	
	await authState.login(authState.loginState.phoneNumber)
	startResendTimer()
}

const startResendTimer = () => {
	resendTimer.value = 60
	resendInterval = setInterval(() => {
		resendTimer.value--
		if (resendTimer.value <= 0) {
			if (resendInterval) {
				clearInterval(resendInterval)
				resendInterval = null
			}
		}
	}, 1000)
}

const goBack = () => {
	if (authState.loginState.step === 'otp') {
		authState.loginState.step = 'phone'
		authState.otpCode.value = ''
		authState.error.value = null
	} else {
		router.push('/welcome')
	}
}

const goToRegister = () => {
	router.push('/auth/register')
}

// Cleanup
onUnmounted(() => {
	if (resendInterval) {
		clearInterval(resendInterval)
	}
})

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
			<h1 class="text-lg font-semibold text-foreground">Вход</h1>
			<div class="w-10"></div> <!-- Spacer -->
		</div>
		
		<!-- Content -->
		<div class="flex-1 px-6 py-8">
			<!-- Phone Number Step -->
			<div v-if="authState.loginState.step === 'phone'" class="space-y-6">
				<div class="text-center">
					<h2 class="text-2xl font-bold text-foreground mb-2">
						Добро пожаловать!
					</h2>
					<p class="text-muted-foreground">
						Введите номер телефона для входа в систему
					</p>
				</div>
				
				<form @submit.prevent="handleLogin" class="space-y-6">
					<app-input
						:modelValue="phoneNumber"
						@update:modelValue="handlePhoneInput"
						label="Номер телефона"
						placeholder="+7 (___) ___-__-__"
						type="tel"
						inputmode="tel"
						pattern="[+7-0-9]*"
						required
						:error="authState.error.value || undefined"
						hint="Формат: +7 или 8 с 10 цифрами (например: +77771234567)"
					/>
					
					<app-button
						type="submit"
						:loading="authState.isLoading.value"
						:disabled="!isValidPhone"
						full-width
						size="lg"
					>
						Получить код
					</app-button>
				</form>
			</div>
			
			<!-- OTP Step -->
			<div v-else class="space-y-6">
				<div class="text-center">
					<h2 class="text-2xl font-bold text-foreground mb-2">
						Подтверждение
					</h2>
					<p class="text-muted-foreground mb-4">
						Введите код, отправленный на номер<br>
						<span class="font-medium text-foreground">{{ authState.loginState.phoneNumber }}</span>
					</p>
					<button
						@click="authState.loginState.step = 'phone'"
						class="text-primary text-sm hover:underline"
					>
						Изменить номер
					</button>
				</div>
				
				<form @submit.prevent="handleOtpVerification" class="space-y-6">
					<div class="space-y-4">
						<label class="block text-sm font-medium text-foreground text-center">
							Код подтверждения
						</label>
						<otp-input
							v-model="authState.otpCode.value"
							:length="4"
							@complete="handleOtpComplete"
						/>
						<p v-if="authState.error.value" class="text-sm text-destructive text-center">
							{{ authState.error.value }}
						</p>
					</div>
					
					<app-button
						type="submit"
						:loading="authState.isLoading.value"
						:disabled="authState.otpCode.value.length !== 4"
						full-width
						size="lg"
					>
						Подтвердить
					</app-button>
					
					<div class="text-center">
						<button
							type="button"
							@click="resendCode"
							:disabled="resendTimer > 0"
							class="text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
						>
							{{ resendTimer > 0 ? `Отправить повторно через ${resendTimer}с` : 'Отправить код повторно' }}
						</button>
					</div>
				</form>
			</div>
			
			<!-- Info Section -->
			<div class="mt-8 p-4 bg-card rounded-lg border border-border">
				<div class="flex items-start space-x-3">
					<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
						<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-medium text-foreground mb-1">
							Для демонстрации
						</h3>
						<p class="text-xs text-muted-foreground">
							Используйте код <span class="font-mono bg-muted px-1 rounded">1111</span> для входа
						</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="px-6 pb-6 text-center">
			<p class="text-sm text-muted-foreground">
				Нет аккаунта?
				<button @click="goToRegister" class="text-primary hover:underline">
					Зарегистрируйтесь
				</button>
			</p>
		</div>
	</div>
</template>
