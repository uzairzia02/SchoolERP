import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedTransportRoutes({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n🚌 Seeding Transport Routes...");

  const routes = [
    {
      routeName: "North Nazimabad Route",
      routeNumber: "R-001",
      driverName: "Muhammad Ali",
      driverPhone: "03001234567",
      vehicleNo: "KHI-1234",
      capacity: 35,
    },
    {
      routeName: "Gulshan Route",
      routeNumber: "R-002",
      driverName: "Ahmed Khan",
      driverPhone: "03007654321",
      vehicleNo: "KHI-5678",
      capacity: 40,
    },
    {
      routeName: "DHA Route",
      routeNumber: "R-003",
      driverName: "Bilal Ahmed",
      driverPhone: "03009876543",
      vehicleNo: "KHI-9012",
      capacity: 30,
    },
  ];

  for (const route of routes) {
    await prisma.transport.upsert({
      where: {
        schoolId_routeNumber: {
          schoolId,
          routeNumber: route.routeNumber,
        },
      },
      update: {
        ...route,
      },
      create: {
        schoolId,
        ...route,
      },
    });

    console.log(`✅ ${route.routeName}`);
  }

  console.log("🚌 Transport Routes Seed Completed");
}