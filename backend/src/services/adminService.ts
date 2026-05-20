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
}
