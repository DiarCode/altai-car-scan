import type { 
	LoginRequest, 
	RegisterRequest, 
	OtpVerificationRequest, 
	AuthResponse, 
	User 
} from '../models/auth.models'

class AuthService {
	// Mock login - just validates phone number format
	async login(request: LoginRequest): Promise<AuthResponse> {
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// Basic phone number validation (Kazakhstan format)
		const phoneRegex = /^(\+7|8)[0-9]{10}$/
		if (!phoneRegex.test(request.phoneNumber)) {
			return {
				success: false,
				message: 'Неверный формат номера телефона'
			}
		}
		
		return {
			success: true,
			message: 'SMS с кодом отправлен'
		}
	}
	
	// Mock OTP verification - only accepts "1111"
	async verifyOtp(request: OtpVerificationRequest): Promise<AuthResponse> {
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		if (request.otp !== '1111') {
			return {
				success: false,
				message: 'Неверный код подтверждения'
			}
		}
		
		return {
			success: true,
			message: 'Авторизация успешна',
			token: 'mock-jwt-token'
		}
	}
	
	// Mock registration
	async register(request: RegisterRequest): Promise<AuthResponse> {
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// Basic validation
		if (!request.name.trim()) {
			return {
				success: false,
				message: 'Имя обязательно для заполнения'
			}
		}
		
		if (!request.carModel.trim()) {
			return {
				success: false,
				message: 'Модель автомобиля обязательна для заполнения'
			}
		}
		
		if (request.carYear < 1990 || request.carYear > new Date().getFullYear()) {
			return {
				success: false,
				message: 'Неверный год выпуска автомобиля'
			}
		}
		
		// Simulate saving to backend
		const mockUser: User = {
			id: Date.now().toString(),
			...request
		}
		
		// Store in localStorage for demo
		localStorage.setItem('user', JSON.stringify(mockUser))
		
		return {
			success: true,
			message: 'Регистрация успешна. SMS с кодом отправлен'
		}
	}
	
	// Get current user
	getCurrentUser(): User | null {
		const userData = localStorage.getItem('user')
		return userData ? JSON.parse(userData) : null
	}
	
	// Logout
	logout(): void {
		localStorage.removeItem('user')
		localStorage.removeItem('token')
	}
}

export const authService = new AuthService()
