-- AlterTable: Add HRRP review fields to ConfirmationRequest
ALTER TABLE "ConfirmationRequest" ADD COLUMN "hrrpReviewedById" TEXT;
ALTER TABLE "ConfirmationRequest" ADD COLUMN "hrrpReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ConfirmationRequest_hrrpReviewedById_idx" ON "ConfirmationRequest"("hrrpReviewedById");

-- AddForeignKey
ALTER TABLE "ConfirmationRequest" ADD CONSTRAINT "ConfirmationRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;