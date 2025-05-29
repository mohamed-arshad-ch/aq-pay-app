import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Test the connection
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((error: Error) => {
    console.error("Failed to connect to the database:", error);
  });

export { prisma };
