-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RepositorySource" AS ENUM ('ZIP', 'GITHUB', 'GITLAB', 'BITBUCKET');

-- CreateEnum
CREATE TYPE "RepositoryStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('ARCHITECTURE', 'TECHNICAL_DEBT', 'COMPLEXITY', 'DUPLICATION', 'SECURITY', 'PERFORMANCE', 'DEPENDENCIES');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DocumentationType" AS ENUM ('README', 'API_REFERENCE', 'ARCHITECTURE', 'ONBOARDING', 'CHANGELOG', 'CONTRIBUTING');

-- CreateEnum
CREATE TYPE "DocumentFormat" AS ENUM ('MARKDOWN', 'HTML', 'PDF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_type" "RepositorySource" NOT NULL,
    "source_url" TEXT,
    "file_path" TEXT NOT NULL,
    "status" "RepositoryStatus" NOT NULL DEFAULT 'PROCESSING',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "analysis_type" "AnalysisType" NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "architecture_maps" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "architecture_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_debt_reports" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "complexity_score" INTEGER NOT NULL,
    "duplication_score" INTEGER NOT NULL,
    "dependency_score" INTEGER NOT NULL,
    "maintainability_score" INTEGER NOT NULL,
    "security_score" INTEGER NOT NULL,
    "issues" JSONB NOT NULL,
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technical_debt_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documentation" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "doc_type" "DocumentationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" "DocumentFormat" NOT NULL DEFAULT 'MARKDOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_paths" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "phases" JSONB NOT NULL,
    "estimated_time" TEXT NOT NULL,
    "prerequisites" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "repositories_user_id_idx" ON "repositories"("user_id");

-- CreateIndex
CREATE INDEX "repositories_status_idx" ON "repositories"("status");

-- CreateIndex
CREATE INDEX "repositories_created_at_idx" ON "repositories"("created_at");

-- CreateIndex
CREATE INDEX "analyses_repository_id_idx" ON "analyses"("repository_id");

-- CreateIndex
CREATE INDEX "analyses_analysis_type_idx" ON "analyses"("analysis_type");

-- CreateIndex
CREATE INDEX "analyses_status_idx" ON "analyses"("status");

-- CreateIndex
CREATE INDEX "chat_conversations_repository_id_idx" ON "chat_conversations"("repository_id");

-- CreateIndex
CREATE INDEX "chat_conversations_user_id_idx" ON "chat_conversations"("user_id");

-- CreateIndex
CREATE INDEX "chat_conversations_created_at_idx" ON "chat_conversations"("created_at");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "architecture_maps_repository_id_idx" ON "architecture_maps"("repository_id");

-- CreateIndex
CREATE INDEX "technical_debt_reports_repository_id_idx" ON "technical_debt_reports"("repository_id");

-- CreateIndex
CREATE INDEX "technical_debt_reports_overall_score_idx" ON "technical_debt_reports"("overall_score");

-- CreateIndex
CREATE INDEX "generated_documentation_repository_id_idx" ON "generated_documentation"("repository_id");

-- CreateIndex
CREATE INDEX "generated_documentation_doc_type_idx" ON "generated_documentation"("doc_type");

-- CreateIndex
CREATE INDEX "onboarding_paths_repository_id_idx" ON "onboarding_paths"("repository_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "usage_metrics_user_id_idx" ON "usage_metrics"("user_id");

-- CreateIndex
CREATE INDEX "usage_metrics_metric_type_idx" ON "usage_metrics"("metric_type");

-- CreateIndex
CREATE INDEX "usage_metrics_created_at_idx" ON "usage_metrics"("created_at");

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "architecture_maps" ADD CONSTRAINT "architecture_maps_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_debt_reports" ADD CONSTRAINT "technical_debt_reports_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documentation" ADD CONSTRAINT "generated_documentation_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_paths" ADD CONSTRAINT "onboarding_paths_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
