-- CreateEnum
CREATE TYPE "SearchType" AS ENUM ('CODE', 'FUNCTION', 'CLASS', 'IMPORT', 'TODO', 'REPOSITORY');

-- CreateEnum
CREATE TYPE "ComparisonType" AS ENUM ('TWO_WAY', 'MULTI_WAY', 'TRENDS', 'BENCHMARK');

-- CreateEnum
CREATE TYPE "ShareResourceType" AS ENUM ('REPOSITORY_EXPORT', 'ANALYSIS_REPORT', 'COMPARISON_REPORT', 'EXECUTIVE_SUMMARY');

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "search_type" "SearchType" NOT NULL,
    "results_count" INTEGER NOT NULL,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comparison_type" "ComparisonType" NOT NULL,
    "repository_ids" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "similarity_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "resource_type" "ShareResourceType" NOT NULL,
    "data" JSONB NOT NULL,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "max_access" INTEGER,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3),

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");

-- CreateIndex
CREATE INDEX "search_history_repository_id_idx" ON "search_history"("repository_id");

-- CreateIndex
CREATE INDEX "search_history_created_at_idx" ON "search_history"("created_at");

-- CreateIndex
CREATE INDEX "comparison_history_user_id_idx" ON "comparison_history"("user_id");

-- CreateIndex
CREATE INDEX "comparison_history_created_at_idx" ON "comparison_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_share_id_key" ON "share_links"("share_id");

-- CreateIndex
CREATE INDEX "share_links_user_id_idx" ON "share_links"("user_id");

-- CreateIndex
CREATE INDEX "share_links_repository_id_idx" ON "share_links"("repository_id");

-- CreateIndex
CREATE INDEX "share_links_share_id_idx" ON "share_links"("share_id");

-- CreateIndex
CREATE INDEX "share_links_expires_at_idx" ON "share_links"("expires_at");
