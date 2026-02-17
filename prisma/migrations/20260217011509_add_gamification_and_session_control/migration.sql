-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "audioData" TEXT;

-- AlterTable
ALTER TABLE "Table" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "DeviceStats" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "badges" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "cafeName" TEXT NOT NULL DEFAULT 'Cafe Delight',
    "cafeTagline" TEXT NOT NULL DEFAULT 'Authentic Flavors',
    "cafeNameNp" TEXT NOT NULL DEFAULT 'क्याफे डिलाइट',
    "cafeTaglineNp" TEXT NOT NULL DEFAULT 'अनिवार्य स्वाद',
    "heroImage" TEXT NOT NULL DEFAULT '/images/momo-buff.png',
    "logoImage" TEXT,
    "openHours" TEXT NOT NULL DEFAULT '10am - 10pm',
    "location" TEXT NOT NULL DEFAULT 'Lakeside, Pokhara',
    "phone" TEXT,
    "showDailySpecial" BOOLEAN NOT NULL DEFAULT false,
    "dailySpecialTitle" TEXT,
    "dailySpecialDescription" TEXT,
    "dailySpecialImage" TEXT,
    "dailySpecialPrice" DOUBLE PRECISION,
    "dailySpecialId" TEXT,
    "pointRate" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "achievementTitle" TEXT NOT NULL DEFAULT 'Your Achievements',
    "achievementDescription" TEXT NOT NULL DEFAULT 'Start of the art gamification system! You get points for every Rs. spent.',
    "achievementMilestoneText" TEXT NOT NULL DEFAULT 'Free Momo Progress',
    "achievementMilestoneTarget" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "maxStaffUsers" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceStats_deviceId_key" ON "DeviceStats"("deviceId");
