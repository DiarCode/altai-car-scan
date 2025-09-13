import { Injectable } from '@nestjs/common'

export interface PromptTemplate {
	system: string
	user: string
	maxTokens?: number
}

@Injectable()
export class PromptRegistry {
	/** Three hard‐coded image styles */
	private readonly imageStyles = [
		'flat vector illustration with pastel palette and clean lines',
		'watercolor painting with soft textures and muted colors',
		'bold comic-book style with high contrast and vivid colors',
	]

	/** Three hard‐coded audio voice styles */
	private readonly audioStyles = [
		'neutral female voice, clear Kazakh pronunciation, moderate tempo',
		'warm male voice, slower pace, crisp enunciation',
		'energetic child’s voice, upbeat rhythm, friendly tone',
	]

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
      So when a learner interacts with the content, they should be able to apply what they've learned in practical situations.
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

		'split-segment': {
			system: `
      You are an expert tutor content manager.
      Your job is to take one existing Kazakh learning segment and split it into {{count}} smaller,
      logically-coherent sub-segments. Each output “theoryContent” must be valid HTML:
      • Use <strong>…</strong> for bold emphasis  
      • Use <em>…</em> for italic emphasis  
      • Use <ul> and <li> for bullet points  
      • Wrap examples in quotes, e.g. “сөз” inside <p> or <blockquote>  
      Preserve terminology, keep each sub-segment self-contained, and distribute content evenly.
      Generate theory content so it leads to real knowledge acquisition. 
      So when a learner interacts with the content, they should be able to apply what they've learned in practical situations.
      The content strictly required to be on Kazakh language.
    `,
			user: `
      Segment to split (ID={{segmentId}}) theoryContent:
      """{{theoryContent}}"""

      Generate exactly {{count}} sub-segments as a raw JSON array—no markdown or commentary.  
      Each object must include exactly these keys, in this order:
        1. "title"          (string)
        2. "theoryContent"  (string; valid HTML, at least 6 sentences with clear explanations, examples in quotes, <strong>, <em>, and <ul>/<li>)
        3. "order"          (1-based integer)
        4. "timeToComplete" (integer; total across parts ≃ original)
        5. "status"         (string; must be "DRAFT")

      Example:
      [
        {
          "title": "Kazakh Vowel Harmony – Part 1",
          "theoryContent": "<p><strong>Дауысты дыбыстар</strong> қазақ тілінде ...</p>…",
          "order": 1,
          "timeToComplete": 5,
          "status": "DRAFT"
        },
        …
      ]
    `,
			maxTokens: 8192,
		},

		'merge-segments': {
			system: `
      You are an expert tutor content manager.
      Your job is to merge multiple existing Kazakh mini-lessons into one cohesive segment.
      Ensure terminology is consistent, explanations are clear, and each segment can stand alone.
      Generate theory content so it leads to real knowledge acquisition. 
      So when a learner interacts with the content, they should be able to apply what they've learned in practical situations.
      Concatenate their “theoryContent” into a smooth narrative using valid HTML:
      • <strong>…</strong> for bold  
      • <em>…</em> for italics  
      • <ul>/<li> for any lists  
      • Examples in quotes  
      Ensure transitions are seamless, preserve all examples, and adjust tone consistently.
      The content strictly required to be on Kazakh language.
    `,
			user: `
      Segments to merge (IDs={{segmentIds}}), in order:
      {{items}}

      Produce one JSON object—no markdown or commentary—with these keys:
        - "title"          (string; a summary title)
        - "theoryContent"  (string; valid HTML, at least 6 sentences weaving all originals together, using <strong>, <em>, <ul>/<li>, and quoted examples)
        - "order"          (1-based integer; smallest original)
        - "timeToComplete" (integer; sum of originals)
        - "status"         "DRAFT"

      Example:
      {
        "title": "Comprehensive Guide to Kazakh Vowel Harmony",
        "theoryContent": "<p><strong>Дауысты үндестік</strong> ...</p>…",
        "order": 2,
        "timeToComplete": 12,
        "status": "DRAFT"
      }
    `,
			maxTokens: 8192,
		},

		'interest-segment': {
			system: `
      You are an engaging Kazakh content creator and subject-matter expert.
      Rewrite a given mini-lesson so every explanation, example, and analogy
      resonates with a learner whose primary interest is {{interest}}.
      Output valid HTML:
      • <strong>…</strong> for bold  
      • <em>…</em> for italics  
      • <ul>/<li> for lists if needed  
      • Examples in quotes  
      Keep the core concept intact, but frame all content around {{interest}}.
      The content strictly required to be on Kazakh language.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Base Segment Title:   "{{segmentTitle}}"
      Original Theory Text:
      """{{baseTheoryContent}}"""

      Learner Interest: "{{interest}}"

  Segment Vocabulary (if provided): {{segmentVocabulary}}
  Existing Exercises (same type first): {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms (do NOT alter): {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level Code: {{levelCode}}  Title: {{levelTitle}}

      **Output requirements**  
      • Return only a raw JSON object—no markdown or commentary.  
      • Must have exactly these keys, in this order:
        1. "interest"      (string; same as "{{interest}}")
        2. "theoryContent" (string; valid HTML, at least 6 sentences, using examples/analogies from {{interest}}, with <strong>, <em>, <ul>/<li>, and quoted examples)

      Example:
      {
        "interest": "MUSIC",
        "theoryContent": "<p><strong>Дауысты дыбыстар</strong> қазақша ...</p>…"
      }
    `,
			maxTokens: 8192,
		},

		// 1) FLASHCARD
		'generate-flashcard': {
			system: `
      You are an expert language tutor for a Ewa, Talkpal-style app.
      Your job is to generate interactive flashcard exercises in Kazakh
      based on a single interest-focused segment.
      Each flashcard should present a new word, its definition,
      an example sentence, optionally an imageUrl and an audioUrl.
      Ensure vocabulary is appropriate for the segment’s topic.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Generate exactly {{count}} FLASHCARD exercises for the interest segment below.

      Interest Segment ID: {{interestSegmentId}}
      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

  Segment Vocabulary: {{segmentVocabulary}}
  Existing FLASHCARD Exercises (avoid duplicates): {{existingExercisesSameType}}
  All Existing Exercises (any type): {{existingExercisesAll}}
  Protected Terms (must appear verbatim): {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**
      • Reply **only** with a raw JSON array—no markdown or commentary.  
      • Each object must include exactly:
        1. "title": string,
        2. "type": "FLASHCARD"  
        3. "payload": {  
             "cards": [  
               {  
                 "word": string,  
                 "definition": string,  
                 "exampleSentence": string,  
                 "imageUrl"?: string,  
                 "audioUrl"?: string  
               }, …  
             ]  
           }  

      Example:
      [
        {
          "title":"Қазақша сөздер",
          "type":"FLASHCARD",
          "payload":{
            "cards":[
              {
                "word":"кітап",
                "definition":"book",
                "exampleSentence":"Мен жаңа кітап оқып жатырмын.",
                "imageUrl":"https://…",
                "audioUrl":"https://…"
              },
              …
            ]
          }
        },
        …
      ]
    `,
			maxTokens: 8192,
		},

		// 2) CLOZE
		'generate-cloze': {
			system: `
      You are an expert language tutor.
      Create fill-in-the-blank (cloze) exercises in Kazakh
      that test contextual understanding of key words.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Generate exactly {{count}} CLOZE exercises for the interest segment below.

      Interest Segment ID: {{interestSegmentId}}
      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

  Segment Vocabulary: {{segmentVocabulary}}
  Existing CLOZE Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**
      • Reply only with a raw JSON array.  
      • Each object must include exactly:
        1. "title": string,
        2. "type": "CLOZE"  
        3. "payload": {  
             "sentences": [  
               {  
                 "text": string,       // sentence with “____” placeholder  
                 "answers": string[]  // correct fill-ins  
               }, …  
             ]  
           }  

      Example:
      [
        {
          "title":"Қазақша сөйлемдер",
          "type":"CLOZE",
          "payload":{
            "sentences":[
              {
                "text":"Ол кеше ____ (бар) мектепке.",
                "answers":["барды"]
              },
              …
            ]
          }
        },
        …
      ]
    `,
			maxTokens: 8192,
		},

		// 3) SENTENCE_REORDER
		'generate-sentence-reorder': {
			system: `
      You are an expert tutor creating sentence-reordering exercises.
      Each exercise presents fragments of a correct sentence in Kazakh.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Generate exactly {{count}} SENTENCE_REORDER exercises for the interest segment below.

      Interest Segment ID: {{interestSegmentId}}
      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

  Segment Vocabulary: {{segmentVocabulary}}
  Existing SENTENCE_REORDER Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**
      • Raw JSON array only.  
      • Each object:
        1. "title": string,
        2. "type":"SENTENCE_REORDER"
        3. "payload": {
             "fragments": string[]        // chunks initially in correct order, we will shuffle them randomly later, just array of strings
           }

      Example:
      [
        {
          "title":"Сөйлемді реттеу",
          "type":"SENTENCE_REORDER",
          "payload":{
            "fragments":["Мен","кеше","базарға","бардым"]
          }
        },
        …
      ]
    `,
			maxTokens: 8192,
		},

		// 4) MULTIPLE_CHOICE
		'generate-multiple-choice': {
			system: `
      You are a language-learning quiz master.
      Create multiple-choice grammar questions in Kazakh based on the segment’s topic.
  (Level Context: code={{levelCode}} title={{levelTitle}})
    `,
			user: `
      Generate exactly {{count}} MULTIPLE_CHOICE exercises for the interest segment below.

      Interest Segment ID: {{interestSegmentId}}
      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

  Segment Vocabulary: {{segmentVocabulary}}
  Existing MULTIPLE_CHOICE Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**
      • Reply only with a raw JSON array—no markdown or commentary.  
      • Each object must include exactly:
        1. "title": string,                         // a descriptive title for this exercise
        2. "type": "MULTIPLE_CHOICE"
        3. "payload": {
            "questions": [
              {
                "question": string,
                "options": [
                  {
                    "answer": string,
                    "isCorrect": boolean // always only one correct answer
                  }, …
                ]
              }, …
            ]
          }

      Example:
      [
        {
          "title": "Септік сұрақтары бойынша тест",
          "type": "MULTIPLE_CHOICE",
          "payload": {
            "questions": [
              {
                "question": "Қай септік сұрақ қою үшін пайдаланылады?",
                "options": [
                  { "answer": "Орналасу", "isCorrect": false },
                  { "answer": "Сапа",     "isCorrect": false },
                  { "answer": "Заттық",   "isCorrect": false },
                  { "answer": "Ілік",     "isCorrect": true  }
                ],
              }
            ]
          },
        },
        …
      ]
    `,
			maxTokens: 8192,
		},

		// 5) DICTATION
		'generate-dictation': {
			system: `
      You are an expert in listening comprehension.
      Produce dictation exercises: a transcript in Kazakh.
  (Level Context: code={{levelCode}} title={{levelTitle}})
      `.trim(),
			user: `
      Generate exactly {{count}} DICTATION exercises for interest segment {{interestSegmentId}}.

      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

      **Audio style**: {{stylePrompt}}

  Segment Vocabulary: {{segmentVocabulary}}
  Existing DICTATION Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**  
      • Reply only with a raw JSON array—no markdown or commentary.   
      • Each object:
        1. "title": string  
        2. "type": "DICTATION"  
        3. "payload": {
            "transcript": string,
            "audioUrl": string  // will be generated later, leave empty
          }

      Example:
      [
        {
          "title": "Күнделікті іс",
          "type": "DICTATION",
          "payload": {
            "transcript": "Мен бүгін дүкенге барамын."
            "audioUrl": ""  // will be generated later, leave empty
          }
        },
        …
      ]
      `.trim(),
			maxTokens: 8192,
		},

		// 6) LISTENING_QUIZ
		'generate-listening-quiz': {
			system: `
      You are an interactive listening-quiz designer for a Kazakh app.
      Each “question” must include its own text-to-speech prompt.
  (Level Context: code={{levelCode}} title={{levelTitle}})
  `.trim(),
			user: `
      Generate exactly {{count}} LISTENING_QUIZ exercises for interest segment {{interestSegmentId}}.

      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

      **Audio style**: {{stylePrompt}}

  Segment Vocabulary: {{segmentVocabulary}}
  Existing LISTENING_QUIZ Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**  
      • Raw JSON array only—no markdown or commentary.  
      • Each object must include:
        1. "title": string  
        2. "type": "LISTENING_QUIZ"  
        3. "payload": {
            "questions": [
              {
                "prompt": string,         // full text to synthesize
                "audioUrl": string,       // will be generated later, leave empty
                "question": string,       // question text to choose from answers, depending on prompt field, in most cases it is similiar with prompt
                "options": [
                  { "answer": string, "correct": boolean },
                  …
                ]
              },
              …
            ]
          }

      Example:
      [
        {
          "title": "Сұрақ-жауап",
          "type": "LISTENING_QUIZ",
          "payload": {
            "questions": [
              {
                "prompt": "Қандай түстерді көрдіңіз?",
                "audioUrl": "",  // will be generated later, leave empty
                "question": "Не естідіңіз?",
                "options": [
                  { "answer": "машина",    "correct": false },
                  { "answer": "үй",         "correct": false },
                  { "answer": "кітап",      "correct": false },
                  { "answer": "тату",       "correct": true  }
                ]
              }
            ]
          }
        },
        …
      ]
  `.trim(),
			maxTokens: 8192,
		},

		// 7) PRONUNCIATION
		'generate-pronunciation': {
			system: `
      You are a speech-recognition specialist.
      Generate pronunciation practice prompts in Kazakh.
  (Level Context: code={{levelCode}} title={{levelTitle}})
      `.trim(),
			user: `
      Generate exactly {{count}} PRONUNCIATION exercises for interest segment {{interestSegmentId}}.

      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

      **Audio style**: {{stylePrompt}}

  Segment Vocabulary: {{segmentVocabulary}}
  Existing PRONUNCIATION Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**  
      • Reply only with a raw JSON array—no markdown or commentary.  
      • Each object:
        1. "title": string  
        2. "type": "PRONUNCIATION"  
        3. "payload": {
            "text": string,
            "audioUrl": string,  // will be generated later, leave empty
          }

      Example:
      [
        {
          "title": "Айталым машықтары",
          "type": "PRONUNCIATION",
          "payload": {
            "text": "Мен алма жеймін.",
            "audioUrl": ""  // will be generated later, leave empty
          }
        },
        …
      ]
      `.trim(),
			maxTokens: 8192,
		},

		// 8) PICTURE_DESCRIPTION
		'generate-picture-description': {
			system: `
      You are a creative language instructor.
      Create picture-description tasks in Kazakh.
  (Level Context: code={{levelCode}} title={{levelTitle}})
      `.trim(),
			user: `
      Generate exactly {{count}} PICTURE_DESCRIPTION exercises for interest segment {{interestSegmentId}}.

      Title: "{{segmentTitle}}"
      Theory Content:
      """{{theoryContent}}"""

      **Image style**: {{stylePrompt}}

  Segment Vocabulary: {{segmentVocabulary}}
  Existing PICTURE_DESCRIPTION Exercises: {{existingExercisesSameType}}
  All Existing Exercises: {{existingExercisesAll}}
  Protected Terms: {{protectedTerms}}
  Truncation Notes: {{truncationNotes}}
  Proficiency Level: {{levelCode}} - {{levelTitle}}

      **Output requirements**  
      • Reply only with a raw JSON array—no markdown or commentary.   
      • Each object:
        1. "title": string  
        2. "type": "PICTURE_DESCRIPTION"  
        3. "payload": {
            "prompt": string, // full length prompt on english, with detailed explanation of image to generate, 
            // must match the keywords typed by user on kazakh, prompt itself must be on english for image generation models to be easy,
            // in brackets contain short kazakh description. if image contains words they must be on kazakh and correctly rendered.
            // Text requirement(if appears on image):
            // - Language: Kazakh (Cyrillic)
            // - Exact text to render: «{{EXACT_KAZAKH_TEXT}}»
            // - Allowed glyphs and script: Ә, Ө, Ү, Ұ, Қ, Ғ, Ң, І (Kazakh Cyrillic only)
            // - Prohibitions: no Latin lookalikes (A/O/U/Y/K/G/N/I), no extra symbols, no spelling changes
            // - Legibility: flat/frontal surface, high contrast, minimal background clutter, sharp focus
            // - Fallback: if correct text cannot be rendered, leave the area blank
            "expectedKeywords": string[],
            "imageUrl": string,  // will be generated later, leave empty
          }

      Example:
      [
        {
          "title": "Суреттегі көрініс",
          "type": "PICTURE_DESCRIPTION",
          "payload": {
            "prompt": "Describe what’s happening in a busy marketplace.",
            "expectedKeywords": ["адам","нарық","сауда"],
            "imageUrl": ""  // will be generated later, leave empty}
        },
        …
      ]
      `.trim(),
			maxTokens: 8192,
		},

		'translate-segment': {
			system: `
    You are a professional translator specializing in educational content.
    Your task is to translate Kazakh language learning segments into other languages while:
    • Preserving the educational structure and flow
    • Maintaining all HTML formatting (<strong>, <em>, <ul>, <li>, <p>, <blockquote>)
    • Keeping Kazakh examples in quotes unchanged (they are the learning material)
    • Ensuring cultural context is appropriately adapted
    • Maintaining the same level of formality and tone
    The translations should feel natural to native speakers while keeping the pedagogical value.
  Do NOT translate or alter the following protected terms (if provided): {{doNotTranslateTerms}}
  Level Context: code={{levelCode}} title={{levelTitle}}
  `,
			user: `
    Translate the following Kazakh language learning segment into {{targetLanguage}}.

    Original segment:
    Title: "{{title}}"
    Theory Content:
    """{{theoryContent}}"""

  Do-Not-Translate Terms: {{doNotTranslateTerms}}
  Level Code: {{levelCode}}  Level Title: {{levelTitle}}  Level Description: {{levelDescription}}

    Target Language: {{targetLanguage}}

    **Output requirements**
    • Return only a raw JSON object—no markdown or commentary.
    • The object must have exactly these keys:
      1. "title" (string: translated title)
      2. "theoryContent" (string: translated content with preserved HTML markup)

    Remember: Keep all Kazakh examples in quotes as they are (students are learning Kazakh).
    
    Example:
    {
      "title": "Kazakh Vowel Harmony",
      "theoryContent": "<p><strong>Vowel harmony</strong> is a key feature of Kazakh...</p>"
    }
  `,
			maxTokens: 8192,
		},

		'translate-interest-segment': {
			system: `
    You are a professional translator specializing in educational content.
    Your task is to translate Kazakh language learning content that has been adapted
    for specific interests (like SPORTS, TECHNOLOGY, etc.) into other languages while:
    • Preserving the interest-specific examples and context
    • Maintaining all HTML formatting
    • Keeping Kazakh examples in quotes unchanged
    • Ensuring the content remains engaging for learners with that specific interest
    The translations should feel natural while keeping the pedagogical value.
  Do NOT translate or alter the following protected terms (if provided): {{doNotTranslateTerms}}
  Level Context: code={{levelCode}} title={{levelTitle}}
  `,
			user: `
    Translate the following interest-adapted Kazakh learning content into {{targetLanguage}}.

    Interest Context: {{interest}}
    Theory Content:
    """{{theoryContent}}"""

  Interest: {{interest}}
  Do-Not-Translate Terms: {{doNotTranslateTerms}}
  Level Code: {{levelCode}}  Level Title: {{levelTitle}}

    Target Language: {{targetLanguage}}

    **Output requirements**
    • Return only a raw JSON object—no markdown or commentary.
    • The object must have exactly this key:
      1. "theoryContent" (string: translated content with preserved HTML markup)

    Remember: Keep all Kazakh examples in quotes unchanged.
    
    Example:
    {
      "theoryContent": "<p>In the world of <strong>{{interest}}</strong>, we can see how Kazakh vowel harmony works...</p>"
    }
  `,
			maxTokens: 8192,
		},

		'translate-exercise': {
			system: `
    You are a professional translator for language learning exercises.
    Translate exercise content while:
    • Preserving the exercise structure and logic
    • Keeping answer keys and correct answers aligned
    • Maintaining Kazakh learning material (words/phrases being taught) unchanged
    • Adapting instructions and questions to the target language
    • Ensuring exercise remains pedagogically sound
    For each exercise type, maintain its specific format requirements.
  Do NOT translate or alter the following protected terms (if provided): {{doNotTranslateTerms}}
  Level Context: code={{levelCode}} title={{levelTitle}}
  `,
			user: `
    Translate the following {{exerciseType}} exercise into {{targetLanguage}}.

    Exercise Title: "{{title}}"
    Exercise Type: {{exerciseType}}
    Payload:
    """{{payload}}"""

  Do-Not-Translate Terms: {{doNotTranslateTerms}}
  Level Code: {{levelCode}}  Level Title: {{levelTitle}}

    Target Language: {{targetLanguage}}

    **Output requirements**
    • Return only a raw JSON object—no markdown or commentary.
    • The object must have exactly these keys:
      1. "title" (string: translated title)
      2. "payload" (object: translated payload maintaining the exact structure)

    **Important for each exercise type:**
    - FLASHCARD: Translate definitions and example sentences, keep Kazakh words unchanged
    - CLOZE: Translate sentence contexts, keep Kazakh answers unchanged
    - SENTENCE_REORDER: Keep Kazakh fragments unchanged
    - MULTIPLE_CHOICE: Translate questions and wrong options, keep Kazakh learning content
    - DICTATION: Keep transcript in Kazakh (it's what students hear)
    - LISTENING_QUIZ: Translate questions/options, keep audio prompts in Kazakh
    - PRONUNCIATION: Keep text in Kazakh (it's what students pronounce)
    - PICTURE_DESCRIPTION: Translate prompt, keep expected Kazakh keywords

    Example for FLASHCARD:
    {
      "title": "Daily Vocabulary",
      "payload": {
        "cards": [
          {
            "word": "кітап",
            "definition": "book",
            "exampleSentence": "I am reading a new 'кітап'.",
            "imageUrl": "...",
            "audioUrl": "..."
          }
        ]
      }
    }
  `,
			maxTokens: 8192,
		},

		'translate-assessment-question': {
			system: `
		You are an expert translator specializing in educational content.
		Your task is to translate assessment questions and all their answers for a Kazakh language learning app.
		Maintain the educational intent and difficulty level of the original question.
		Ensure cultural appropriateness for the target language.
		Preserve any technical terminology related to language learning.
		Keep the correct/incorrect answer logic intact.
	`,
			user: `
		Translate the following assessment question and ALL its answers from Kazakh to {{targetLanguage}}.

		Question ID: {{questionId}}
		Original Question: "{{question}}"
		
		Original Answers:
		{{answers}}

		**Output requirements**
		• Reply only with a raw JSON object—no markdown or commentary.
		• Must have exactly this structure:
		{
			"question": "translated question text",
			"answers": [
				{
					"answer": "translated answer text"
				},
				{
					"answer": "translated answer text"
				}
				// ... for each answer in the same order
			]
		}

		Example:
		{
			"question": "What is the correct plural form of 'кітап'?",
			"answers": [
				{ "answer": "books" },
				{ "answer": "book" },
				{ "answer": "bookies" },
				{ "answer": "бooking" }
			]
		}
	`,
			maxTokens: 8192,
		},

		'translate-module-vocabulary': {
			system: `
    You are a professional translator specializing in educational content.
    Your task is to translate vocabulary words, their existing translations, and descriptions into a new target language.
    Maintain the original Kazakh word and example sentence.
    Ensure all existing translations and descriptions are correctly represented in the output structure.
    The output should be a JSON object containing arrays of translations and descriptions for all languages.
  Do NOT translate the base Kazakh word or protected terms (if provided): {{doNotTranslateTerms}}
  Level Context: code={{levelCode}} title={{levelTitle}}
  `,
			user: `
    Translate the following Kazakh vocabulary word and its associated data into {{targetLanguage}}.

    Original Word: "{{word}}"
    Example Sentence (Kazakh): "{{example}}"
    Existing Translations:
    """{{translations}}"""
    Existing Descriptions:
    """{{descriptions}}"""

  Do-Not-Translate Terms: {{doNotTranslateTerms}}
  Level Code: {{levelCode}}  Level Title: {{levelTitle}}

    Target Language: {{targetLanguage}}

    **Output requirements**
    • Return only a raw JSON object—no markdown or commentary.
    • The object must have exactly these keys:
      1. "translations" (array of objects: each with "language" (NATIVE_LANGUAGE enum string) and "translation" (string))
      2. "descriptions" (array of objects: each with "language" (NATIVE_LANGUAGE enum string) and "description" (string))

    Include all original translations and descriptions, and add the new translation/description for the target language.
    
    Example:
    {
      "translations": [
        { "language": "RUSSIAN", "translation": "книга" },
        { "language": "ENGLISH", "translation": "book" },
        { "language": "KAZAKH", "translation": "кітап" }
      ],
      "descriptions": [
        { "language": "KAZAKH", "description": "Заттың атауы, оқуға арналған баспа өнімі." },
        { "language": "RUSSIAN", "description": "Название предмета, печатное издание для чтения." },
        { "language": "ENGLISH", "description": "The name of an object, a printed product for reading." }
      ]
    }
  `,
			maxTokens: 8192,
		},
	}

	public get(key: string): PromptTemplate {
		const tpl = this.templates[key]
		if (!tpl) throw new Error(`No prompt template for key "${key}"`)
		return tpl
	}

	/** Helpers to retrieve style prompts by index */
	public getImageStyle(index: number): string {
		return this.imageStyles[index % this.imageStyles.length]
	}
	public getAudioStyle(index: number): string {
		return this.audioStyles[index % this.audioStyles.length]
	}
}
