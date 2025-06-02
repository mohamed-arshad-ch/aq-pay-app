/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the column as nullable
ALTER TABLE "WalletTransaction" ADD COLUMN "orderId" TEXT;

-- Update existing records with generated order IDs
UPDATE "WalletTransaction" 
SET "orderId" = 'AQ' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
WHERE "orderId" IS NULL;

-- Make the column NOT NULL and add unique constraint
ALTER TABLE "WalletTransaction" ALTER COLUMN "orderId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_orderId_key" ON "WalletTransaction"("orderId");

-- CreateIndex
CREATE INDEX "WalletTransaction_orderId_idx" ON "WalletTransaction"("orderId");
