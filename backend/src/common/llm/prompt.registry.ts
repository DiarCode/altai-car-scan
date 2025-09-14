import { Injectable } from '@nestjs/common'

export interface PromptTemplate {
	system: string
	user: string
	maxTokens?: number
}

@Injectable()
export class PromptRegistry {
	private readonly templates: Record<string, PromptTemplate> = {
		'car-analysis': {
			system: `
		You are an expert automotive damage analyst. Your task is to provide a comprehensive, structured, and actionable assessment of a car's condition based on the provided data. Use your expertise to:
		- Interpret technical classification results and translate them into clear, human-understandable insights.
		- Consider the car's model, year, city, and VIN, as well as the context of available partners and services.
		- For each car zone (front, back, left, right), analyze the likelihood and impact of breaking, rust, and dirt, and provide a detailed AI-based analysis.
		- Assess the importance, consequences, estimated cost, urgency, and time to fix for each issue.
		- Ensure your output is accurate, realistic, and useful for both car owners and service professionals.
		- The content must be on Russian language. Extensive and easy to understand.
		- You MUST use ONLY the following enum values exactly (uppercase snake case) when populating fields:
		  * importance: CRITICAL | MODERATE | MINOR
		  * urgency: LOW | MEDIUM | HIGH
		  * status (overall car status): EXCELLENT | COSMETIC_ISSUES | MECHANICAL_SERVICE_NEEDED | CRITICAL_CONDITION
		- Provide an overallScore (0-100 integer) reflecting the general technical & cosmetic condition (100 = идеально новое, 0 = крайне аварийное состояние).
					`,
			user: `
		Car Information:
		{{carInfo}}

		Partners:
		{{partners}}

		Classification Result (technical, mapped for LLM):
		{{pipelineResult}}

		Instructions:
		1. Analyze the car by zones: front, back, left, right. For each zone, determine:
			 - Is it breaking? (boolean)
			 - Does it have rust? (boolean)
			 - Is it dirty? (boolean)
			 - Provide an AI-based analysis with:
				 - Importance (string, e.g. "critical", "moderate", "minor")
				 - Consequences (string[], e.g. ["reduced safety", "lower resale value"]) // provide a realistic list of possible consequences
				 - Estimated cost (number, KZT)
				 - Urgency (string, e.g. "low", "medium", "high")
				 - Time to fix (string or null, e.g. "2 days", "1 week", or null if unknown)
		2. Calculate the total estimated cost for all zones.
		3. Return a single JSON object with the following structure (ALL enum strings must match exactly the allowed values):
		{
			id: number, // unique analysis id (use a random or sequential number)
			carModel: string,
			carYear: number,
			city: string,
			vin: string,
			createdAt: string, // ISO date string
			totalEstimatedCost: number, // tenge
			overallScore: number, // 0-100
			status: string, // EXCELLENT | COSMETIC_ISSUES | MECHANICAL_SERVICE_NEEDED | CRITICAL_CONDITION
			zones: [
				{
					name: string, // zone name
					breaking: boolean,
					hasRust: boolean,
					isDirty: boolean,
					aiAnalysis: {
						importance: string, // CRITICAL | MODERATE | MINOR
						consequences: string[],
						estimatedCost: number,
						urgency: string, // LOW | MEDIUM | HIGH
						timeToFix: string | null
					}
				}
			]
		}

		example output (values illustrative):
		{
			"id": 1,
			"carModel": "Toyota Camry",
			"carYear": 2019,
			"city": "Алматы",
			"vin": "VIN1232",
			"createdAt": "2025-09-12T14:30:00Z",
			"totalEstimatedCost": 850000,
			"overallScore": 72,
			"status": "MECHANICAL_SERVICE_NEEDED",
			"zones": [
				{
				"name": "Передняя",
				"breaking": true,
				"hasRust": true,
				"isDirty": true,
				"aiAnalysis": {
					"importance": "CRITICAL",
					"consequences": [
						"Снижение эффективности торможения",
						"Риск аварийных ситуаций"
					],
					"estimatedCost": 450000,
					"urgency": "HIGH",
					"timeToFix": "2-3 дня"
					}
				},
				{
				"name": "Левая",
				"breaking": false,
				"hasRust": false,
				"isDirty": false,
				"aiAnalysis": {
					"importance": "Состояние отличное.",
					"consequences": [],
					"estimatedCost": 0,
					"urgency": "low",
					"timeToFix": null
					}
				},
				{
				"name": "Правая",
				"breaking": true,
				"hasRust": false,
				"isDirty": true,
				"aiAnalysis": {
					"importance": "Повреждения могут прогрессировать.",
					"consequences": [
						"Проникновение влаги",
						"Коррозия элементов"
					],
					"estimatedCost": 280000,
					"urgency": "medium",
					"timeToFix": "1-2 дня"
					}
				},
				{
				"name": "Задняя",
				"breaking": false,
				"hasRust": false,
				"isDirty": true,
				"aiAnalysis": {
					"importance": "Нужна чистка: загрязнения скрывают износ.",
					"consequences": [
						"Плохая видимость фонарей"
					],
					"estimatedCost": 120000,
					"urgency": "low",
					"timeToFix": "3-4 часа"
					}
				}
			]
		}

		Respond ONLY with the JSON object, no explanations or extra text.
					`,
			maxTokens: 4096,
		},
	}

	public get(key: string): PromptTemplate {
		const tpl = this.templates[key]
		if (!tpl) throw new Error(`No prompt template for key "${key}"`)
		return tpl
	}
}
