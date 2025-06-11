/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_codigo_key" ON "users"("codigo");
