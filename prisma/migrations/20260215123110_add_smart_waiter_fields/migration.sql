-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "userLat" DOUBLE PRECISION,
ADD COLUMN     "userLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "BlockedDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDevice_deviceId_key" ON "BlockedDevice"("deviceId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
