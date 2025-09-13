-- CreateEnum
CREATE TYPE "NATIVE_LANGUAGE" AS ENUM ('KAZAKH', 'RUSSIAN', 'ENGLISH');

-- CreateEnum
CREATE TYPE "ADMIN_ROLE" AS ENUM ('ADMIN', 'TEACHER', 'HELPDESK');

-- CreateEnum
CREATE TYPE "APPROVAL_STATUS" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "INTEREST" AS ENUM ('ART', 'SPORTS', 'TECHNOLOGY', 'BUSINESS', 'TRAVEL');

-- CreateEnum
CREATE TYPE "NOTIFICATION_TYPE" AS ENUM ('ONBOARDING_WELCOME', 'LEVEL_ASSIGNED', 'DAILY_TASK_CREATED', 'DAILY_TASK_COMPLETED', 'DAILY_TASK_INCOMPLETE', 'VOCAB_REVIEW_DUE', 'CHAT_SESSION_COMPLETED', 'CHAT_INACTIVITY_NUDGE', 'FREE_CHAT_NUDGE', 'WEEKLY_SUMMARY');

-- CreateEnum
CREATE TYPE "NOTIFICATION_CHANNEL" AS ENUM ('PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "DEVICE_PLATFORM" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "PUSH_PROVIDER" AS ENUM ('EXPO');

-- CreateEnum
CREATE TYPE "RECIPIENT_TYPE" AS ENUM ('LEARNER');

-- CreateEnum
CREATE TYPE "NOTIFICATION_STATUS" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "LEVEL_CODE" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');

-- CreateEnum
CREATE TYPE "EXERCISE_TYPE" AS ENUM ('FLASHCARD', 'CLOZE', 'SENTENCE_REORDER', 'MULTIPLE_CHOICE', 'DICTATION', 'LISTENING_QUIZ', 'PRONUNCIATION', 'PICTURE_DESCRIPTION');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "role" "ADMIN_ROLE" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "native_language" "NATIVE_LANGUAGE" NOT NULL,
    "interests" "INTEREST"[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_level_id" INTEGER NOT NULL,
    "daily_time_goal" INTEGER NOT NULL,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_otp_requests" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "phone_number" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_otp_requests" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "phone_number" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_sessions" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proficiency_levels" (
    "id" SERIAL NOT NULL,
    "code" "LEVEL_CODE" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "proficiency_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" SERIAL NOT NULL,
    "proficiency_level_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "image_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "proficiency_level_id" INTEGER NOT NULL,
    "theory_content" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "APPROVAL_STATUS" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "theory_content" TEXT NOT NULL,
    "module_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "time_to_complete" INTEGER NOT NULL,
    "status" "APPROVAL_STATUS" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_segments" (
    "id" SERIAL NOT NULL,
    "segment_id" INTEGER NOT NULL,
    "interest" "INTEREST" NOT NULL,
    "theory_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interest_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "interest_segment_id" INTEGER NOT NULL,
    "type" "EXERCISE_TYPE" NOT NULL,
    "status" "APPROVAL_STATUS" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_vocabularies" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "example" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_vocabulary_translations" (
    "id" SERIAL NOT NULL,
    "vocabulary_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "translation" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_vocabulary_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_vocabularies" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "example" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_vocabulary_progress" (
    "id" SERIAL NOT NULL,
    "learner_vocabulary_id" INTEGER NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "mastery_level" INTEGER NOT NULL,
    "streak" INTEGER NOT NULL,
    "next_review_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_vocabulary_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_translations" (
    "id" SERIAL NOT NULL,
    "segment_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "title" TEXT NOT NULL,
    "theory_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_segment_translations" (
    "id" SERIAL NOT NULL,
    "interest_segment_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "theory_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interest_segment_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_translations" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_question_translations" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "question" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_question_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answer_translations" (
    "id" SERIAL NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "language" "NATIVE_LANGUAGE" NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_answer_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tasks" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learner_id" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_task_exercises" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "daily_task_id" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_task_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER,
    "token" TEXT NOT NULL,
    "provider" "PUSH_PROVIDER" NOT NULL DEFAULT 'EXPO',
    "platform" "DEVICE_PLATFORM" NOT NULL,
    "locale" TEXT,
    "timezone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "recipient_type" "RECIPIENT_TYPE" NOT NULL DEFAULT 'LEARNER',
    "type" "NOTIFICATION_TYPE" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "deep_link" TEXT,
    "channel" "NOTIFICATION_CHANNEL" NOT NULL DEFAULT 'IN_APP',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "status" "NOTIFICATION_STATUS" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_phone_number_key" ON "admins"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "learners_phone_number_key" ON "learners"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "admin_otp_requests_admin_id_key" ON "admin_otp_requests"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_otp_requests_learner_id_key" ON "learner_otp_requests"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_admin_id_key" ON "admin_sessions"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "learner_sessions_learner_id_key" ON "learner_sessions"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_sessions_token_key" ON "learner_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "proficiency_levels_code_key" ON "proficiency_levels"("code");

-- CreateIndex
CREATE INDEX "assessment_questions_proficiency_level_id_idx" ON "assessment_questions"("proficiency_level_id");

-- CreateIndex
CREATE INDEX "assessment_answers_question_id_idx" ON "assessment_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "modules_proficiency_level_id_order_key" ON "modules"("proficiency_level_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "segments_module_id_order_key" ON "segments"("module_id", "order");

-- CreateIndex
CREATE INDEX "exercises_type_idx" ON "exercises"("type");

-- CreateIndex
CREATE UNIQUE INDEX "module_vocabulary_translations_vocabulary_id_language_key" ON "module_vocabulary_translations"("vocabulary_id", "language");

-- CreateIndex
CREATE INDEX "segment_translations_segment_id_idx" ON "segment_translations"("segment_id");

-- CreateIndex
CREATE INDEX "segment_translations_language_idx" ON "segment_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "segment_translations_segment_id_language_key" ON "segment_translations"("segment_id", "language");

-- CreateIndex
CREATE INDEX "interest_segment_translations_interest_segment_id_idx" ON "interest_segment_translations"("interest_segment_id");

-- CreateIndex
CREATE INDEX "interest_segment_translations_language_idx" ON "interest_segment_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "interest_segment_translations_interest_segment_id_language_key" ON "interest_segment_translations"("interest_segment_id", "language");

-- CreateIndex
CREATE INDEX "exercise_translations_exercise_id_idx" ON "exercise_translations"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_translations_language_idx" ON "exercise_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_translations_exercise_id_language_key" ON "exercise_translations"("exercise_id", "language");

-- CreateIndex
CREATE INDEX "assessment_question_translations_question_id_idx" ON "assessment_question_translations"("question_id");

-- CreateIndex
CREATE INDEX "assessment_question_translations_language_idx" ON "assessment_question_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_question_translations_question_id_language_key" ON "assessment_question_translations"("question_id", "language");

-- CreateIndex
CREATE INDEX "assessment_answer_translations_answer_id_idx" ON "assessment_answer_translations"("answer_id");

-- CreateIndex
CREATE INDEX "assessment_answer_translations_language_idx" ON "assessment_answer_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_answer_translations_answer_id_language_key" ON "assessment_answer_translations"("answer_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- AddForeignKey
ALTER TABLE "learners" ADD CONSTRAINT "learners_assigned_level_id_fkey" FOREIGN KEY ("assigned_level_id") REFERENCES "proficiency_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_otp_requests" ADD CONSTRAINT "admin_otp_requests_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_otp_requests" ADD CONSTRAINT "learner_otp_requests_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_sessions" ADD CONSTRAINT "learner_sessions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_proficiency_level_id_fkey" FOREIGN KEY ("proficiency_level_id") REFERENCES "proficiency_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_proficiency_level_id_fkey" FOREIGN KEY ("proficiency_level_id") REFERENCES "proficiency_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interest_segments" ADD CONSTRAINT "interest_segments_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_interest_segment_id_fkey" FOREIGN KEY ("interest_segment_id") REFERENCES "interest_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_vocabularies" ADD CONSTRAINT "module_vocabularies_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_vocabulary_translations" ADD CONSTRAINT "module_vocabulary_translations_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "module_vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_vocabularies" ADD CONSTRAINT "learner_vocabularies_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_vocabulary_progress" ADD CONSTRAINT "learner_vocabulary_progress_learner_vocabulary_id_fkey" FOREIGN KEY ("learner_vocabulary_id") REFERENCES "learner_vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_vocabulary_progress" ADD CONSTRAINT "learner_vocabulary_progress_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_translations" ADD CONSTRAINT "segment_translations_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interest_segment_translations" ADD CONSTRAINT "interest_segment_translations_interest_segment_id_fkey" FOREIGN KEY ("interest_segment_id") REFERENCES "interest_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_translations" ADD CONSTRAINT "exercise_translations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_question_translations" ADD CONSTRAINT "assessment_question_translations_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answer_translations" ADD CONSTRAINT "assessment_answer_translations_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "assessment_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_exercises" ADD CONSTRAINT "daily_task_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_exercises" ADD CONSTRAINT "daily_task_exercises_daily_task_id_fkey" FOREIGN KEY ("daily_task_id") REFERENCES "daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
