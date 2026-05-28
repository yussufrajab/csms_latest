-- AlterTable
ALTER TABLE "PromotionRequest" ADD COLUMN "hrrpReviewedById" TEXT;
ALTER TABLE "PromotionRequest" ADD COLUMN "hrrpReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PromotionRequest_hrrpReviewedById_idx" ON "PromotionRequest"("hrrpReviewedById");

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;