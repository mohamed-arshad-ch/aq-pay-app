// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { User } from "@/store/slices/usersSlice";

interface PrismaUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  _count: {
    accounts: number;
    transactions: number;
  };
  accounts: {
    id: string;
    accountName: string;
    accountNumber: string;
    accountHolderName: string;
    routingNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountType: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
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
        _count: {
          select: {
            accounts: true,
            transactions: true,
          },
        },
        // Include accounts data
        accounts: {
          select: {
            id: true,
            accountName: true,
            accountType: true,
            accountNumber: true,
            accountHolderName: true,
            routingNumber: true,
            ifscCode: true,
            bankName: true,
            branchName: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Get transaction volumes for all users in a single query
    const transactionVolumes = await prisma.walletTransaction.groupBy({
      by: ['userId'],
      _sum: {
        amount: true,
      },
      where: {
        userId: {
          in: users.map(user => user.id)
        }
      }
    });

    // Create a map for quick lookup
    const volumeMap = new Map(
      transactionVolumes.map(tv => [tv.userId, tv._sum.amount || 0])
    );

    // Transform the data to match our User interface
    const transformedUsers = users.map((user: PrismaUser): User => {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: null, // Add phoneNumber to your User model if needed
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.updatedAt.toISOString(), // Use updatedAt as proxy for lastLogin
        twoFactorEnabled: false, // Add this field to your User model if needed
        status: user.emailVerified ? "ACTIVE" : "INACTIVE", // Base status on email verification
        role: "USER", // Default role, add role field to your User model if needed
        linkedAccounts: user._count.accounts,
        transactionCount: user._count.transactions,
        transactionVolume: volumeMap.get(user.id) || 0,
        riskLevel: "low", // Calculate based on your business logic
        kycStatus: user.emailVerified ? "complete" : "pending", // Base on email verification
        // Transform accounts data
        accounts: user.accounts.map(account => ({
          id: account.id,
          accountName: account.accountName,
          accountNumber: account.accountName, // Using accountName as accountNumber since it's not in schema
          accountHolderName: account.accountHolderName,
          routingNumber: account.routingNumber,
          ifscCode: account.ifscCode,
          bankName: account.bankName,
          branchName: account.branchName,
          accountType: account.accountType,
          isDefault: account.isDefault,
          balance: 0, // Default balance since it's not in the schema
          currency: "USD", // Default currency
          type: account.accountType.toUpperCase() as "SAVINGS" | "CHECKING" | "CREDIT_CARD" | "LOAN" | "UNKNOWN",
          status: account.isDefault ? "ACTIVE" : "PENDING",
          createdAt: account.createdAt.toISOString(),
          updatedAt: account.updatedAt.toISOString(),
        })),
      };
    });

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}