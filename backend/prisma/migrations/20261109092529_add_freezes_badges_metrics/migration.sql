-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "metricType" TEXT NOT NULL DEFAULT 'STEPS';

-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "metricValue" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "streakFreezes" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "streak_freezes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_freezes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "badgeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "streak_freezes_userId_challengeId_date_key" ON "streak_freezes"("userId", "challengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "badges_userId_badgeType_key" ON "badges"("userId", "badgeType");

-- AddForeignKey
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
