-- AlterTable: Add email column to Employee
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- AlterTable: Add hrrpReviewedById and hrrpReviewedAt to CadreChangeRequest
ALTER TABLE "CadreChangeRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedById" TEXT;
ALTER TABLE "CadreChangeRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedAt" TIMESTAMP(3);
ALTER TABLE "CadreChangeRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add commissionLetterKey to ConfirmationRequest
ALTER TABLE "ConfirmationRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add commissionLetterKey to PromotionRequest
ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add hrrpReviewedById, hrrpReviewedAt, commissionLetterKey to LwopRequest
ALTER TABLE "LwopRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add hrrpReviewedById and hrrpReviewedAt to RetirementRequest
ALTER TABLE "RetirementRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedById" TEXT;
ALTER TABLE "RetirementRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedAt" TIMESTAMP(3);
ALTER TABLE "RetirementRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add hrrpReviewedById and hrrpReviewedAt to SeparationRequest
ALTER TABLE "SeparationRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedById" TEXT;
ALTER TABLE "SeparationRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedAt" TIMESTAMP(3);
ALTER TABLE "SeparationRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add hrrpReviewedById and hrrpReviewedAt to ServiceExtensionRequest
ALTER TABLE "ServiceExtensionRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedById" TEXT;
ALTER TABLE "ServiceExtensionRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedAt" TIMESTAMP(3);
ALTER TABLE "ServiceExtensionRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- AlterTable: Add hrrpReviewedById and hrrpReviewedAt to ResignationRequest
ALTER TABLE "ResignationRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedById" TEXT;
ALTER TABLE "ResignationRequest" ADD COLUMN IF NOT EXISTS "hrrpReviewedAt" TIMESTAMP(3);
ALTER TABLE "ResignationRequest" ADD COLUMN IF NOT EXISTS "commissionLetterKey" TEXT;

-- CreateIndex: Add indexes for hrrpReviewedById on tables that were missing them
CREATE INDEX IF NOT EXISTS "CadreChangeRequest_hrrpReviewedById_idx" ON "CadreChangeRequest"("hrrpReviewedById");
CREATE INDEX IF NOT EXISTS "RetirementRequest_hrrpReviewedById_idx" ON "RetirementRequest"("hrrpReviewedById");
CREATE INDEX IF NOT EXISTS "SeparationRequest_hrrpReviewedById_idx" ON "SeparationRequest"("hrrpReviewedById");
CREATE INDEX IF NOT EXISTS "ServiceExtensionRequest_hrrpReviewedById_idx" ON "ServiceExtensionRequest"("hrrpReviewedById");
CREATE INDEX IF NOT EXISTS "ResignationRequest_hrrpReviewedById_idx" ON "ResignationRequest"("hrrpReviewedById");

-- AddForeignKey: Add foreign key constraints for hrrpReviewedById
ALTER TABLE "CadreChangeRequest" ADD CONSTRAINT "CadreChangeRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetirementRequest" ADD CONSTRAINT "RetirementRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SeparationRequest" ADD CONSTRAINT "SeparationRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceExtensionRequest" ADD CONSTRAINT "ServiceExtensionRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResignationRequest" ADD CONSTRAINT "ResignationRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;