-- create-assessment-tests-a2.sql
-- Seed all A2-level assessment questions & answers (20 items)

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

-- Q1: «Адам» сөзінің синонимін көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  '«Адам» сөзінің синонимін көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кісі',     TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Есім',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шатыр',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Барлық',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Аты-жөні', FALSE, NOW(), NOW());

-- Q2: Дұрыс жауапты таңдаңыз: Сәуле парақшасына ... салды.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс жауапты таңдаңыз: Сәуле парақшасына ... салды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Блог',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Пост',  TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Адам',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шырын', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ыстық', FALSE, NOW(), NOW());

-- Q3: «Ата-ана» сөзіне мәндес сөзді көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  '«Ата-ана» сөзіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Құрбы',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әже',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әке',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Әке-шеше', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Батыр',    FALSE, NOW(), NOW());

-- Q4: Дұрыс жауапты таңдаңыз: Анам туған күніме ....... жасады.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс жауапты таңдаңыз: Анам туған күніме ....... жасады.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тосынсый',  TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қоныс той', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қыз ұзату', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қонақжай',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қарындас',  FALSE, NOW(), NOW());

-- Q5: «Кәрі» сөзіне мәндес сөзді көрсетіңіз
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  '«Кәрі» сөзіне мәндес сөзді көрсетіңіз',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жас',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қарт',    TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сәби',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Нәресте', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Аласа',   FALSE, NOW(), NOW());

-- Q6: Дұрыс жауапты таңдаңыз: Қайша .... қыз екен.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс жауапты таңдаңыз: Қайша .... қыз екен.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақылды', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шақыру', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ренжу',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Туралы', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бірдей', FALSE, NOW(), NOW());

-- Q7: Туыстық атауды көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Туыстық атауды көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Немере',    TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Балапан',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қошақан',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақкөңіл',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мейірімді', FALSE, NOW(), NOW());

-- Q8: Жыл мезгілін көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Жыл мезгілін көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көктем',    TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Таңертең',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кешке',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Түсте',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ертең',     FALSE, NOW(), NOW());

-- Q9: Дене мүшесін көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дене мүшесін көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Арқа',     TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Денелі',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сымбатты', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мезгіл',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Заңгер',   FALSE, NOW(), NOW());

-- Q10: Мамандық атауын көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Мамандық атауын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шаштараз', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқырман',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрермен', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқушы',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ата-ана',  FALSE, NOW(), NOW());

-- Q11: Дұрыс жауапты таңдаңыз: Дәрігер не істейді?
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс жауапты таңдаңыз: Дәрігер не істейді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Емдейді', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқытады',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Үйретеді',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қорғайды',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қуанады',FALSE, NOW(), NOW());

-- Q12: Дұрыс жауапты таңдаңыз: Әнші не істейді?
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс жауапты таңдаңыз: Әнші не істейді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Емдейді',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ән айтады', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шана тебеді',FALSE,NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сурет салады',FALSE,NOW(),NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқиды',      FALSE,NOW(),NOW());

-- Q13: Күшейтпелі шырайды көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Күшейтпелі шырайды көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қып-қызыл', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жаңа',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ескі',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ескілеу',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мейірімді', FALSE, NOW(), NOW());

-- Q14: Дұрыс қосымшаны белгілеңіз: Менің әкем – заң...
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Дұрыс қосымшаны белгілеңіз: Менің әкем – заң...',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-ғар', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-гер', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-шы',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-ші',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), '-лер', FALSE, NOW(), NOW());

-- Q15: Сөйлемді толықтырыңыз: ..., билетіңізді алыңыз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Сөйлемді толықтырыңыз: ..., билетіңізді алыңыз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Міне', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайсы',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қанша',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Және', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайда',FALSE, NOW(), NOW());

-- Q16: Сөйлемді толықтырыңыз: Бөлмеде .... жоқ.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Сөйлемді толықтырыңыз: Бөлмеде .... жоқ.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кейбір',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ешкім', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ешқайда',FALSE,NOW(),NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қашан', FALSE,NOW(),NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Үнсіз',FALSE,NOW(),NOW());

-- Q17: Мәтінді оқып, сұраққа жауап беріңіз: Мөлдірдің анасы қайда жұмыс істейді?
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Мәтінді оқып, сұраққа жауап беріңіз: Мөлдірдің анасы қайда жұмыс істейді?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мектепте',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дүкенде',    TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Офисте',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Банкте',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ауруханада', FALSE, NOW(), NOW());

-- Q18: Сөйлемді толықтырыңыз: Дәулет Есіл ... тұрады.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Сөйлемді толықтырыңыз: Дәулет Есіл ... тұрады.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бөлмесінде', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ауласында',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жанында',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қасында',    TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ықшам ауданында',FALSE,NOW(),NOW());

-- Q19: «Баспана» тақырыбына қатысты сөзді көрсетіңіз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  '«Баспана» тақырыбына қатысты сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шатыр', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Рәміз', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Пышақ', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бала',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қолғап',FALSE, NOW(), NOW());

-- Q20: Диалогты толықтырыңыз.
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'A2'),
  'Диалогты толықтырыңыз:\n- Қайырлы кеш. Қош келдіңіз!\n- ______\n- Дастарқанға жүріңіз!\n- ______\n- Асыңыз дәмді болсын!',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы кеш/Рақмет, Берік мырза', TRUE,  NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы таң/Кешіріңіз',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы түн',                  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы таң/Ас болсын!',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қайырлы кеш/Ас болсын!',        FALSE, NOW(), NOW());

COMMIT;
