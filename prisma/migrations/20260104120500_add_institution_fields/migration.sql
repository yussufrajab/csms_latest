-- AlterTable
ALTER TABLE "Institution" ADD COLUMN "email" TEXT;
ALTER TABLE "Institution" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "Institution" ADD COLUMN "voteNumber" TEXT;
ALTER TABLE "Institution" ADD COLUMN "tinNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Institution_tinNumber_key" ON "Institution"("tinNumber");
