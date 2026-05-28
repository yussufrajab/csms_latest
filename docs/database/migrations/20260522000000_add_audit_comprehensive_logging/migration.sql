-- AlterTable: Replace `userAgent` column with `deviceInfo` (Json type)
-- and change `wasBlocked` default from true to false
ALTER TABLE "AuditLog" DROP COLUMN "userAgent";
ALTER TABLE "AuditLog" ADD COLUMN "deviceInfo" Json;
ALTER TABLE "AuditLog" ALTER COLUMN "wasBlocked" SET DEFAULT false;