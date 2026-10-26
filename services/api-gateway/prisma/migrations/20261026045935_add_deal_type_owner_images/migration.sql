-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('SALE', 'RENT', 'LEASE');

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_agentId_fkey";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "dealType" "DealType" NOT NULL DEFAULT 'SALE',
ADD COLUMN     "depositInr" BIGINT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ownerId" TEXT,
ALTER COLUMN "agentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Listing_dealType_status_idx" ON "Listing"("dealType", "status");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
