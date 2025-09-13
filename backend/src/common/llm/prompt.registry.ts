import { Injectable } from '@nestjs/common'

export interface PromptTemplate {
	system: string
	user: string
	maxTokens?: number
}

@Injectable()
export class PromptRegistry {
  private readonly templates: Record<string, PromptTemplate> = {
		'theory-segments': {
			system: `
      You are an expert tutor for a Talkpal, Ewa-style language app.
      Your job is to generate self-contained lessons in Kazakh,
      each formatted entirely in valid HTML:
      • Use <strong>…</strong> for bold emphasis
      • Use <em>…</em> for italic emphasis
      • Use <ul> and <li> for bullet lists
      • Wrap any illustrative example in quotes, e.g. “кітап” inside a <p> or <blockquote>
      Ensure terminology is consistent, explanations are clear, and each segment can stand alone.
      Generate theory content so it leads to real knowledge acquisition. 
      So when a user interacts with the content, they should be able to apply what they've learned in practical situations.
      The content strictly required to be on Kazakh language.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Generate exactly {{count}} sequential segments for the module below.

      Proficiency Level: {{proficiencyLevel}}
      Module Title: "{{moduleTitle}}"
      Description: {{moduleDescription}}
      Module Expected Outcomes: {{outcomes}}
      Module Theory Content: {{theoryContent}}
      Module's vocabulary(must be used in segments): {{vocabulary}}

  Optional Extended Context (some values may be NONE):
  • Proficiency Level Code: {{levelCode}}
  • Proficiency Level Title: {{levelTitle}}
  • Proficiency Level Description: {{levelDescription}}
  • Previous Modules (most recent first): {{previousModules}}
  • Previous Vocabulary: {{previousVocabulary}}
  • Current Module Vocabulary (truncated if long): {{currentVocabulary}}
  • Protected Terms (must appear verbatim, do NOT alter): {{protectedTerms}}
  • Truncation / Omission Notes: {{truncationNotes}}

  Use ONLY current module vocabulary for introducing new concepts; reference previous vocabulary only for reinforcement without re-teaching it. Avoid duplicating earlier module segment content; build upon it.
  Maintain difficulty appropriate for the proficiency level.

      **Output requirements**  
      • Respond **only** as a raw JSON array—**no** markdown, code fences, or commentary.  
      • Each object in the array must include exactly these keys, in this order:
        1. "title"          (string)
        2. "theoryContent"  (string; valid HTML markup, at least 6 sentences covering definition, explanation, and a brief example. Include <strong>, <em>, <ul>/<li>, and examples in quotes.)
        3. "order"          (1-based integer)
        4. "timeToComplete" (integer, estimated minutes)
        5. "status"         (string; must be "DRAFT")

      Example output:
      [
        {
          "title": "Kazakh Vowels and Harmony",
          "theoryContent": "<p><strong>Дауысты дыбыстар</strong> – қазақ тілінде жұптасып келеді. <em>Алдыңғы</em> және <em>артқы</em> дауыссыздар сөз ішіндегі жалғауларға әсер етеді.</p><ul><li>Мысалы, “кітап” сөзінде “а” артқы дауыссыз, сондықтан көптік жалғауы “-тар” болады → “кітаптар”.</li><li>“өнер” сөзінде “ө” алдыңғы дауыссыз, сондықтан көптік “-лер” → “өнерлер”.</li></ul><p>Еске сақтаңыз: дауыссыз үндестік кез келген жалғауға ықпал етеді.</p>",
          "order": 1,
          "timeToComplete": 7,
          "status": "DRAFT"
        },
        …
      ]
    `,
			maxTokens: 16384,
		},
  }

	public get(key: string): PromptTemplate {
		const tpl = this.templates[key]
		if (!tpl) throw new Error(`No prompt template for key "${key}"`)
		return tpl
	}
}
