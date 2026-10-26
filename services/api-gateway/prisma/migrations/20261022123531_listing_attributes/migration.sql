-- CreateEnum
CREATE TYPE "Facing" AS ENUM ('EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST');

-- CreateEnum
CREATE TYPE "Furnishing" AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED');

-- CreateEnum
CREATE TYPE "Possession" AS ENUM ('READY', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH');

-- CreateEnum
CREATE TYPE "Approval" AS ENUM ('DTCP', 'HMDA', 'RERA');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "ageYears" INTEGER,
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "approval" "Approval",
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "carpetSqft" INTEGER,
ADD COLUMN     "cornerPlot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "facing" "Facing",
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "furnishing" "Furnishing",
ADD COLUMN     "gated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parking" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plotAreaSqYd" INTEGER,
ADD COLUMN     "possession" "Possession" NOT NULL DEFAULT 'READY',
ADD COLUMN     "pricePerSqft" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roadWidthFt" INTEGER,
ADD COLUMN     "totalFloors" INTEGER;
