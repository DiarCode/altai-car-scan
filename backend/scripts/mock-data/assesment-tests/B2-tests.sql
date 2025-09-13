-- create-assessment-tests-b2.sql
-- Seed all B2-level assessment questions & answers
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
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: ата-...',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шеше', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бөле', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Баба', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Дана', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Аға',  FALSE, NOW(), NOW());

-- Q2
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Туыстық атауды көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Нағашы',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көркем',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көктем',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ыстық',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жануар',   FALSE, NOW(), NOW());

-- Q3
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Ұлдың әйелі қалай аталады?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Келін',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жеңге',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Абысын', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Бажа',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Немере', FALSE, NOW(), NOW());

-- Q4
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  '«Сырт келбет» тіркесіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тыртық',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақ шашты', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Түр-сипат', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сымбатты', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сүйкімді',  FALSE, NOW(), NOW());

-- Q5
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  '«Ауру» сөзіне мәндес сөзді көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сырқат',      TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қабылдау',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өлшеу',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Терлеу',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жедел жәрдем',FALSE, NOW(), NOW());

-- Q6
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Маржан қызуы көтеріліп, .... шақырды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жолдама',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сараптама',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жедел жәрдем', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көлік',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жауырын',      FALSE, NOW(), NOW());

-- Q7
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Бүгін жиналыста хатшы ... толтырды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қолхат',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сенімхат',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ақпараттық хат',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Хаттама',       TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Алғыс хат',     FALSE, NOW(), NOW());

-- Q8
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Сүт тағамдарын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қаймақ, ет, балмұздақ',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айран, сары май, қаймақ',TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айран, бәліш, қаймақ',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айран, ірімшік, нан',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айран, құрт, сорпа',     FALSE, NOW(), NOW());

-- Q9
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Қарлығаш .... әдемі жейде сатып алды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Киім үлгісі',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сән апталығы',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сән үйінен',        TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Балабақшадан',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Емханадан',         FALSE, NOW(), NOW());

-- Q10
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Әсем, үйді ......',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'үтіктедің бе?',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'тазаладың ба?',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'жедің бе?',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'іштің бе?',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'қостың ба?',     FALSE, NOW(), NOW());

-- Q11
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Көптеген жүк көліктері .... күні бойы өте алмай тұр.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Биліктен', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Есітен',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кеденнен', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көрмеден', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Барлығы',  FALSE, NOW(), NOW());

-- Q12
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Картаңыздың ... теріңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Құжатын',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Саудасын',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Жинағын',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Құпия сөзін',  TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Есімін',       FALSE, NOW(), NOW());

-- Q13
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Сіз ... жиі пайдаланасыз ба?',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Отандық өнімді',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Табиғатты',        FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Табыс көзін',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ішкі сауданы',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сыртқы сауданы',   FALSE, NOW(), NOW());

-- Q14
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  '«Төбесі көкке жету» фразасының мағынасын көрсетіңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қатты қуану',     TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қатты ренжу',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қатты ашулану',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қатты ауыру',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Биікке шығу',     FALSE, NOW(), NOW());

-- Q15
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  '«Босқа әуре болу» мағынасында қолданатын фразалық тіркесті белгілеңіз.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көңілі шат болу', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ықылық ату',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Арам тер болу',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көзін жою',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Көңілі қалу',     FALSE, NOW(), NOW());

-- Q16
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Оқушылар кітаптарды ... сатып алды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өзі',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өздері', TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өзімен', FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өзге',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Өзінен', FALSE, NOW(), NOW());

-- Q17
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  '... инемен құдық қазғандай',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Білім',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Оқу',         TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сабақ',       FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Тәжірибе',    FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Білімділік',  FALSE, NOW(), NOW());

-- Q18
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Түнгі тыныштықты ... қағылған есік тарсылы бұзды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шұғылдан',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кенеттен',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Абайсызда',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ешқандай',   FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Ортасынан',  FALSE, NOW(), NOW());

-- Q19
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Дұрыс жауапты таңдаңыз: Кішкентай балақай ... деп ауладағы кішкене күшікті шақырды.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Мо-мо',      FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Кә-кә',      TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Шөре-шөре',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қырау-қырау',FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Қау-қау',    FALSE, NOW(), NOW());

-- Q20
INSERT INTO assessment_questions (proficiency_level_id, question, created_at, updated_at) VALUES (
  (SELECT id FROM proficiency_levels WHERE code = 'B2'),
  'Мерекеде күн аяз ..., барлық қала тұрғындары үйлерінен шықпай отыр.',
  NOW(), NOW()
);
INSERT INTO assessment_answers (question_id, answer, is_correct, created_at, updated_at) VALUES
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Баратындықтан',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Айтатындықтан',  FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Болғандықтан',   TRUE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Сол себепті',     FALSE, NOW(), NOW()),
  (currval(pg_get_serial_sequence('assessment_questions','id')), 'Күнделікті',      FALSE, NOW(), NOW());

COMMIT;
