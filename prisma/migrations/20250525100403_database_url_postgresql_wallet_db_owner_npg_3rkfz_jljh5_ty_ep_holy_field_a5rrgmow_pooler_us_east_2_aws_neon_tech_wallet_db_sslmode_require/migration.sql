/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountHolderName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountType` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "accountHolderName" TEXT NOT NULL,
ADD COLUMN     "accountType" TEXT NOT NULL,
ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "routingNumber" TEXT;

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "Wallet";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
