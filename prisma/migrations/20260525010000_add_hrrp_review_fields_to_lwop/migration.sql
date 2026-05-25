-- AlterTable: Add HRRP review fields to LwopRequest
ALTER TABLE "LwopRequest" ADD COLUMN "hrrpReviewedById" TEXT;
ALTER TABLE "LwopRequest" ADD COLUMN "hrrpReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LwopRequest_hrrpReviewedById_idx" ON "LwopRequest"("hrrpReviewedById");

-- AddForeignKey
ALTER TABLE "LwopRequest" ADD CONSTRAINT "LwopRequest_hrrpReviewedByToUser_fkey" FOREIGN KEY ("hrrpReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;