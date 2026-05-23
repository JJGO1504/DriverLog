import { PrismaClient } from '@prisma/client';
import { TripService } from './tripService';

const prisma = new PrismaClient();

export class AdminService {
  static async getOverview() {
    const [totalDrivers, totalVehicles, totalTrips, trips] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.trip.count(),
      prisma.trip.findMany({ include: { vehicle: true } }),
    ]);

    const totalNetProfit = trips.reduce((sum, trip: any) => {
      return sum + TripService.calculateRealNetProfit(trip, trip.vehicle);
    }, 0);

    return {
      totalDrivers,
      totalVehicles,
      totalTrips,
      totalNetProfit,
      averageProfitPerDriver: totalDrivers > 0 ? totalNetProfit / totalDrivers : 0,
    };
  }

  static async getMaintenanceAlerts() {
    const vehicles = await prisma.vehicle.findMany();
    const maintenances = await prisma.maintenance.findMany();

    return vehicles.flatMap(vehicle => {
      return TripService.checkMaintenanceAlerts(vehicle, maintenances);
    });
  }

  static async getMetrics() {
    const [totalUsers, totalTripsAgg, totalMaintAgg, users, recentMaintenances] = await Promise.all([
      prisma.user.count(),
      prisma.trip.aggregate({ _sum: { ingresoBruto: true } }),
      prisma.maintenance.aggregate({ _sum: { costoReal: true } }),
      prisma.user.findMany({ select: { id: true, nombre: true, email: true, role: true, avatarUrl: true } }),
      prisma.maintenance.findMany({
        where: { status: 'REALIZADO' },
        orderBy: { fechaEjecucion: 'desc' },
        take: 10,
        include: { vehicle: true },
      }),
    ]);

    const totalIncome = totalTripsAgg._sum.ingresoBruto || 0;
    const totalMaintenanceCost = totalMaintAgg._sum.costoReal || 0;

    return {
      totalUsers,
      totalIncome,
      totalMaintenanceCost,
      netBalance: totalIncome - totalMaintenanceCost,
      users,
      recentMaintenances,
    };
  }
}
