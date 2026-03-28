-- Keep older databases in sync with current Prisma schema used by staff modules.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "TrainerCheckin"
ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT 'QR';

ALTER TABLE "TrainerCheckin"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'APPROVED';
