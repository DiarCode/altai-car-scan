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
					`,
			user: `
		Car Information:
		{{carInfo}}

		Partners:
		{{partners}}

		Services:
		{{services}}

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
				 - Urgency (string, e.g. "immediate", "soon", "can wait")
				 - Time to fix (string or null, e.g. "2 days", "1 week", or null if unknown)
		2. Calculate the total estimated cost for all zones.
		3. Return a single JSON object with the following structure:
		{
			id: number, // unique analysis id (use a random or sequential number)
			carModel: string,
			carYear: number,
			city: string,
			vin: string,
			createdAt: string, // ISO date string
			totalEstimatedCost: number, // tenge
			zones: [
				{
					name: string, // zone name
					breaking: boolean,
					hasRust: boolean,
					isDirty: boolean,
					aiAnalysis: {
						importance: string,
						consequences: string[],
						estimatedCost: number,
						urgency: string,
						timeToFix: string | null
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
