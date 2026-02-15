-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "isOnlineOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ALTER COLUMN "tableNo" DROP NOT NULL,
ALTER COLUMN "sessionId" DROP NOT NULL;
