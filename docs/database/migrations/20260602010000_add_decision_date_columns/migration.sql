-- AlterTable: Add decisionDate and commissionDecisionDate columns to request tables

-- CadreChangeRequest
ALTER TABLE "CadreChangeRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "CadreChangeRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- LwopRequest
ALTER TABLE "LwopRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "LwopRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- PromotionRequest
ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- RetirementRequest
ALTER TABLE "RetirementRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "RetirementRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- SeparationRequest
ALTER TABLE "SeparationRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "SeparationRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- ServiceExtensionRequest
ALTER TABLE "ServiceExtensionRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "ServiceExtensionRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);

-- ResignationRequest
ALTER TABLE "ResignationRequest" ADD COLUMN IF NOT EXISTS "decisionDate" TIMESTAMP(3);
ALTER TABLE "ResignationRequest" ADD COLUMN IF NOT EXISTS "commissionDecisionDate" TIMESTAMP(3);