-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('REGISTERED', 'PENDING', 'EXTERNAL');

-- AlterTable users: add status column, make email/passwordHash/cardNumber nullable
ALTER TABLE "users"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'REGISTERED',
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ALTER COLUMN "cardNumber" DROP NOT NULL;

-- AlterTable flags: add isVariant column
ALTER TABLE "flags"
  ADD COLUMN "isVariant" BOOLEAN NOT NULL DEFAULT false;
