import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { User } from "@/store/slices/usersSlice";

type PrismaUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
};

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match our User interface
    const transformedUsers = users.map(
      (user: PrismaUser): User => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: null, // Not available in the database
        createdAt: user.createdAt,
        lastLogin: user.updatedAt, // Using updatedAt as lastLogin
        twoFactorEnabled: false, // Not available in the database
        status: "ACTIVE", // Default value since not in database
        role: "USER", // Default value since not in database
        linkedAccounts: 0, // Default value since not in database
        transactionCount: 0, // Default value since not in database
        transactionVolume: 0, // Default value since not in database
        riskLevel: "low", // Default value
        kycStatus: "complete", // Default value
      })
    );

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
