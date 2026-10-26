/*
  Warnings:

  - Added the required column `lat` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `Locality` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `Locality` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Locality" ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "Listing" ALTER COLUMN "lat" DROP DEFAULT, ALTER COLUMN "lng" DROP DEFAULT;
ALTER TABLE "Locality" ALTER COLUMN "lat" DROP DEFAULT, ALTER COLUMN "lng" DROP DEFAULT;
