-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('STANDARD', 'PREMIUM', 'ULTRA');

-- CreateEnum
CREATE TYPE "ProSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "Boost" DROP CONSTRAINT "Boost_professionalId_fkey";

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "monthlySubscriptionPrice" DOUBLE PRECISION,
ADD COLUMN     "subscriberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalTipsReceived" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Boost" ADD COLUMN     "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "BoostType" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "PremiumContent" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "blurUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "unlockCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentUnlock" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFeeAmount" DOUBLE PRECISION NOT NULL,
    "professionalAmount" DOUBLE PRECISION NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFeeAmount" DOUBLE PRECISION NOT NULL,
    "professionalAmount" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProSubscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "status" "ProSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'PHOTO',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "subscribersOnly" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourPack" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HourPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourPackPurchase" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "hoursRemaining" DOUBLE PRECISION NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "platformFeeAmount" DOUBLE PRECISION NOT NULL,
    "professionalAmount" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HourPackPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PremiumContent_professionalId_idx" ON "PremiumContent"("professionalId");

-- CreateIndex
CREATE INDEX "PremiumContent_visible_createdAt_idx" ON "PremiumContent"("visible", "createdAt");

-- CreateIndex
CREATE INDEX "ContentUnlock_clientId_idx" ON "ContentUnlock"("clientId");

-- CreateIndex
CREATE INDEX "ContentUnlock_contentId_idx" ON "ContentUnlock"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentUnlock_contentId_clientId_key" ON "ContentUnlock"("contentId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Tip_stripePaymentIntentId_key" ON "Tip"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Tip_clientId_idx" ON "Tip"("clientId");

-- CreateIndex
CREATE INDEX "Tip_professionalId_createdAt_idx" ON "Tip"("professionalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProSubscription_stripeSubscriptionId_key" ON "ProSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "ProSubscription_clientId_status_idx" ON "ProSubscription"("clientId", "status");

-- CreateIndex
CREATE INDEX "ProSubscription_professionalId_status_idx" ON "ProSubscription"("professionalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProSubscription_clientId_professionalId_key" ON "ProSubscription"("clientId", "professionalId");

-- CreateIndex
CREATE INDEX "Story_professionalId_idx" ON "Story"("professionalId");

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");

-- CreateIndex
CREATE INDEX "HourPack_professionalId_active_idx" ON "HourPack"("professionalId", "active");

-- CreateIndex
CREATE INDEX "HourPackPurchase_clientId_idx" ON "HourPackPurchase"("clientId");

-- CreateIndex
CREATE INDEX "HourPackPurchase_professionalId_idx" ON "HourPackPurchase"("professionalId");

-- CreateIndex
CREATE INDEX "Professional_subscriptionEnabled_idx" ON "Professional"("subscriptionEnabled");

-- CreateIndex
CREATE INDEX "Boost_type_idx" ON "Boost"("type");

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumContent" ADD CONSTRAINT "PremiumContent_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUnlock" ADD CONSTRAINT "ContentUnlock_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "PremiumContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUnlock" ADD CONSTRAINT "ContentUnlock_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProSubscription" ADD CONSTRAINT "ProSubscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProSubscription" ADD CONSTRAINT "ProSubscription_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourPack" ADD CONSTRAINT "HourPack_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourPackPurchase" ADD CONSTRAINT "HourPackPurchase_packId_fkey" FOREIGN KEY ("packId") REFERENCES "HourPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourPackPurchase" ADD CONSTRAINT "HourPackPurchase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

