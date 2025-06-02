/*
  Warnings:

  - You are about to drop the column `accountName` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `accountType` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `branchName` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `routingNumber` on the `Account` table. All the data in the column will be lost.
  - Made the column `ifscCode` on table `Account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "accountName",
DROP COLUMN "accountType",
DROP COLUMN "bankName",
DROP COLUMN "branchName",
DROP COLUMN "isDefault",
DROP COLUMN "routingNumber",
ALTER COLUMN "ifscCode" SET NOT NULL;
