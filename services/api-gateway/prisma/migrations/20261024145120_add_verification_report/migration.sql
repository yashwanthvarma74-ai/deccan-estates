-- CreateEnum
CREATE TYPE "VerifyStatus" AS ENUM ('VERIFIED', 'CAUTION', 'RISK');

-- CreateTable
CREATE TABLE "VerificationReport" (
    "listingId" TEXT NOT NULL,
    "status" "VerifyStatus" NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "demo" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationReport_pkey" PRIMARY KEY ("listingId")
);

-- AddForeignKey
ALTER TABLE "VerificationReport" ADD CONSTRAINT "VerificationReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
