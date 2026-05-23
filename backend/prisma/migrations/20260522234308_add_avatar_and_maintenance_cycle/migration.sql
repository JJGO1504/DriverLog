-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN     "costoReal" DOUBLE PRECISION,
ADD COLUMN     "fechaEjecucion" TIMESTAMP(3),
ADD COLUMN     "kilometrajeRegistro" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT;
