-- create-assessment-tests-c1.sql
-- Seed all C1-level assessment questions & answers
-- (all answers marked is_correct = FALSE for manual review)

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
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Қарлығаш құрбысынан кеше ... ақша алды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сұраққа',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қарызға',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Уақытқа',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Табиғатқа', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ауданға',   FALSE, NOW(), NOW());

-- Q2
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Сәбиге қатысты сөзді белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жөргек',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көгершін', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кептер',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқулық',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бақыт',    FALSE, NOW(), NOW());

-- Q3
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  '«Ақылды» сөзіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрікті',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кемеңгер',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Салауатты',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Денсаулық',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сүйкімді',   FALSE, NOW(), NOW());

-- Q4
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  '«Отан» сөзіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дүние',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Атамекен', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мансап',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Даналық',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақылшы',   FALSE, NOW(), NOW());

-- Q5
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Салт-дәстүрге қатысты сөзді белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тігінші', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Енші',    TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақылшы',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Аспаз',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Маман',   FALSE, NOW(), NOW());

-- Q6
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Бойы ұзын адамды қалай айтады.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сұңғақ бойлы',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тапал адам',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кішкентай бойлы',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақыл-ойлы',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көреген адам',   FALSE, NOW(), NOW());

-- Q7
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Келген қонақтар той иелеріне жылы ... білдірді.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'ықтималдығын',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'үміттерін',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'лебіздерін',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'меймандығын',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'құрылтайын', FALSE, NOW(), NOW());

-- Q8
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Мерей өте көңілді әрі ... жігіт екен.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қалжыңбас',TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Талап',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқулық',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мейіргер', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ықылас',   FALSE, NOW(), NOW());

-- Q9
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Қарт әже бірнеше жыл көрмеген немересін көріп қатты ... .',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ренжіді',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өкінбеді',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Елжіреді',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айыпты',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақталды',   FALSE, NOW(), NOW());

-- Q10
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Жас қыздың ... мінезі барлығын таң қалдырды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қуанышты',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бақытты',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шатақ',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Абырдыған', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Елжіреген', FALSE, NOW(), NOW());

-- Q11
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  Бүгінгі жиналысқа қызметкерлер ... қатысуы керек.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Барлық', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Түгел',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ешкім',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ешбір', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қандай', FALSE, NOW(), NOW());

-- Q12
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз:  ..., бұл сұрақтың жауабы толық жазбаша түрде берілсін.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қанша',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әлбетте', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жөн',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Абзал',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мархабат',FALSE, NOW(), NOW());

-- Q13
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Асты сызылған тіркестің мағынасын түсіндіріңіз: Айрандай ұйып отырған отбасының бір-ақ күнде шырқы бұзылды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Араз',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тату',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дос',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қамқор',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мейірбан', FALSE, NOW(), NOW());

-- Q14
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  '«Ат ізін салмау» тіркесінің мағынасын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келу',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кету',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келмеу', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бармау', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқымау', FALSE, NOW(), NOW());

-- Q15
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Фразалық тіркесті көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қырғи қабақ болу', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бір біріне қамқор', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Алтын қабақ',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қалың қас',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қабырға сағаты',   FALSE, NOW(), NOW());

-- Q16
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Асты сызылған тіркестің мағынасын түсіндіріңіз: Мәдина түнімен көзі талғанша жұмыс істеп, таңертең әзер тұрды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қуану',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаршау', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бару',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келу',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаттану',FALSE, NOW(), NOW());

-- Q17
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Асты сызылған тіркестің мағынасын түсіндіріңіз: Әли алдындағы алып жыланды көргенде, жаны көзіне көрінді.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қуанышты болу', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қорқу',         TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бармау',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айтпау',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайталау',      FALSE, NOW(), NOW());

-- Q18
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз: Орман іші тып-тыныш, ... торғайдың дыбысы ғана естіледі.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Арада',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Барша',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қаншама',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Керемет',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқта-текте',  TRUE, NOW(), NOW());

-- Q19
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'C1'),
  'Дұрыс жауапты таңдаңыз: Жұмысқа жаңадан келген қызметкерді басшылық көп ... .',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шеттетеді', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қарсыласады',FALSE,NOW(),NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Үңіледі',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Арнайды',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқиды',     FALSE, NOW(), NOW());

COMMIT;
