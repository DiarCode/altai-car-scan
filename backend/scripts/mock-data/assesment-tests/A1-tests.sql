-- create-assessment-tests-a1.sql
-- Seed all 20 A1-level assessment questions & answers
-- (all answers marked is_correct = FALSE for manual adjustment)

DO $$
DECLARE
  seq     regclass := pg_get_serial_sequence('assessment_questions','id');
  maxid   int;
BEGIN
  SELECT COALESCE(MAX(id),0) INTO maxid FROM assessment_questions;
  IF maxid = 0 THEN
    PERFORM setval(seq, 1, false);   -- nextval() → 1
  ELSE
    PERFORM setval(seq, maxid, true); -- nextval() → maxid+1
  END IF;
END
$$;

BEGIN;

-- Q1
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Сөйлем құрастырыңыз: кітап, оқыды, ол',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ол кітап оқыды',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кітап мен оқыдым',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кім кітап оқыды?',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ол оқыды кітап',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқыды ол кітап',     FALSE, NOW(), NOW());

-- Q2
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Сөйлем құрастырыңыз: бардым, дүкенге, мен',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кім дүкенге барды?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мен дүкенге бардым',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дүкенге бардым',         FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мен бардым дүкенге',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дүкенге бардым мен',     FALSE, NOW(), NOW());

-- Q3
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Мәтін: Анар – студент. Ол университетте оқиды. Анар қазақ тілін жақсы көреді.
  Анар кім?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Студент',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқушы',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мұғалім',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дәрігер',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Заңгер',    FALSE, NOW(), NOW());

-- Q4
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Мәтін: Анар – студент. Ол университетте оқиды. Анар қазақ тілін жақсы көреді.
  Ол қайда оқиды?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мектепте',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Колледжде',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Институтта',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Университетте', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Лицейде',       FALSE, NOW(), NOW());

-- Q5
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Мәтін: Анар – студент. Ол университетте оқиды. Анар қазақ тілін жақсы көреді.
  Анар қандай тілді жақсы көреді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ағылшын тілін', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шет тілін',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қытай тілін',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қазақ тілін',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Неміс тілін',   FALSE, NOW(), NOW());

-- Q6
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жұпты табыңыз:',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'оқу – оқулық',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'бала – балалар',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кітап – кітаптер',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'дос – достер',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'дала – қала',       FALSE, NOW(), NOW());

-- Q7
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Алма...... барады?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайда?',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'неше?',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қандай?', FALSE, NOW(), NOW());

-- Q8
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Сіздің атыңыз......?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'неше?',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайда?', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қашан?', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',    FALSE, NOW(), NOW());

-- Q9
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Ол..... келеді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайдан?', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қанша?',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'неше?',   FALSE, NOW(), NOW());

-- Q10
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Сіз..... оқисыз?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қандай?', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қай?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'несі?',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайда?',  TRUE, NOW(), NOW());

-- Q11
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Диалогты жалғастырыңыз: - Сәлеметсіз бе! - _______! - Атыңыз кім? - _______. - Қайдан келдіңіз? - _______.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сәлеметсіз бе/Айдар/Астанадан', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жақсы/Жаман/Ақмоладан',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы кеш/Жақсы/Семейге',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сәлеметсіз бе/Жақсы/Алматы',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сәлеметсіз бе/Астана/Жақсы',   FALSE, NOW(), NOW());

-- Q12
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Туыстық атауды көрсетіңіз',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрші',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қазақ',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Үлкен',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әке',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жұмыс',  FALSE, NOW(), NOW());

-- Q13
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Сіз....... жастасыз?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'неше?',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайда?', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қашан?', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',    FALSE, NOW(), NOW());

-- Q14
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Ол..... келеді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайдан?', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қанша?',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'неше?',   FALSE, NOW(), NOW());

-- Q15
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс жауапты таңдаңыз: Сіз..... тұрасыз?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қайда?',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'нение?',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'кім?',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'не?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қандай?',FALSE, NOW(), NOW());

-- Q16
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Дұрыс нұсқаны белгілеңіз: Мен дүкен___ барамын.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'ге',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'де',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'ны',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'мен', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'ше',  FALSE, NOW(), NOW());

-- Q17
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Сөйлем құрастырыңыз: дәптер, алды, Айгүл',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айгүл дәптер алды',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дәптермен алдым',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кім дәптер алды?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айгүл алды дәптер',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Алды Айгүл дәптер',    FALSE, NOW(), NOW());

-- Q18
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Сөйлем құрастырыңыз: бардым, мектепке, мен',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кім мектепке барды?',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мен мектепке бардым',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мектепке бардым',         FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мен бардым мектепке',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мектепке бардым мен',     FALSE, NOW(), NOW());

-- Q19
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  '«Алма» деген не?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сүт',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жеміс',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сусын',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тамақ',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дос',    FALSE, NOW(), NOW());

-- Q20
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A1'),
  'Жемісті көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сүт',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тамақ',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жүзім',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Терезе',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Орындық', FALSE, NOW(), NOW());

COMMIT;
