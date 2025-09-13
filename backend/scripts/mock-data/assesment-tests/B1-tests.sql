-- create-assessment-tests-b1.sql
-- Seed all 20 B1-level assessment questions & answers
-- (all answers initially marked FALSE)

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
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Жастық» сөзіне қарсы мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кәрілік',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жастық шақ', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бозбала',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бойжеткен',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрікті',    FALSE, NOW(), NOW());

-- Q2
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Сәби» сөзіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқушы',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әже',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Балапан',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Торғай',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Нәресте',   TRUE, NOW(), NOW());

-- Q3
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Туыстық атауды көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жеңге',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шырын',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өлең',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Аула',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жаңбыр',   FALSE, NOW(), NOW());

-- Q4
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Мереке атауын белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сәуір',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Маусым',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көктем',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ертіс',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Наурыз',   TRUE, NOW(), NOW());

-- Q5
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Жаз айларын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қаңтар, ақпан, наурыз',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көктем, наурыз, мамыр',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Маусым, шілде, тамыз',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қыркүйек, қазан, қараша', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Желтоқсан, ақпан, мамыр',FALSE, NOW(), NOW());

-- Q6
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Мерекеге қатысты сөзді белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тосынсый, гүлшоғы, отшашу', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Гүлшоғы, қаңтар, отшашу',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тосынсый, гүлшоғы, тамақ',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қонақ, ыдыс, отшашу',         FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бөлме, гүлшоғы, қонақ',       FALSE, NOW(), NOW());

-- Q7
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Сырт-келбетке қатысты сөзді белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көгершін', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Секпіл',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Орамал',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қанат',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Алмұрт',   FALSE, NOW(), NOW());

-- Q8
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Айыппұл» сөзі қай салаға қатысты екенін көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Білім',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Экономика', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дәрігер',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаруашылық',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ғылым',     FALSE, NOW(), NOW());

-- Q9
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Ақерке азық-түлік дүкенінен ...... сатып алды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қарақұмық', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жейде',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Орамал',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қалам',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқу құралы',FALSE, NOW(), NOW());

-- Q10
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Сүзбе денсаулыққа .....',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрікті',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көркем',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Пайдалы',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шикі',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Таза',     FALSE, NOW(), NOW());

-- Q11
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Әшекей бұйымды көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қабырға', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Денсаулық',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Танымал', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Білезік', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мөлдір',  FALSE, NOW(), NOW());

-- Q12
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'алғыс....',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жазу',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Құттықтау',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айту',       TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жату',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жүру',       FALSE, NOW(), NOW());

-- Q13
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Киіз үйдің бөлігін көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Терезе',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қабырға', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шатыр',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаңырақ',TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ертоқым',FALSE, NOW(), NOW());

-- Q14
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Музыкалық аспапты белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шабдалы', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаңырақ',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Домбыра',TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаршы',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Орындық',FALSE, NOW(), NOW());

-- Q15
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Бөлмеде ..... оқушы отыр екен.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бесінші',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Төрт-бес',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Он бірінші',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Екібен бір',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бес жарым', FALSE, NOW(), NOW());

-- Q16
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Аяқ астынан» фразасының мағынасын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қорқу',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кенет',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Баяу',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақырын', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көру',   FALSE, NOW(), NOW());

-- Q17
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Қарсы келу» фразасының мағынасын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келісу',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келіспеу',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қорқу',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қуану',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаттану',  FALSE, NOW(), NOW());

-- Q18
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  '«Кешірім сұрауға» қатысты сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ренжімеңіз',TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Рақмет',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бәрекелді',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тамаша',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Керемет',    FALSE, NOW(), NOW());

-- Q19
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Дұрыс қосымшаны көрсетіңіз:   жақсы...',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-дық', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-лық', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-шық',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-шы', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-паз',FALSE, NOW(), NOW());

-- Q20
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at)
VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B1'),
  'Болымсыздық формадағы қосымшаны көрсетіңіз: ақыл...',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-ды',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-сыз', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-шыл', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-хана',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-паз', FALSE, NOW(), NOW());

COMMIT;
