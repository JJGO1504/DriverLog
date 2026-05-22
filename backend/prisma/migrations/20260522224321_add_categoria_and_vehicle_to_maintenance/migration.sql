-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN     "categoria" TEXT NOT NULL DEFAULT 'OTROS',
ADD COLUMN     "vehicleId" INTEGER;

-- CreateIndex
CREATE INDEX "maintenances_vehicleId_idx" ON "maintenances"("vehicleId");

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
