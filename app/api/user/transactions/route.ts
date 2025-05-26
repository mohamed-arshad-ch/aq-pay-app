import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string | null;
  date: Date;
  fee: number;
  bankAccountId: string | null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify token and get user data
    const decoded = await verifyToken(token);
    if (!decoded) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    // Get user data
    const userData = await prisma.user.findUnique({
      where: {
        email: decoded.email,
      },
    });

    if (!userData) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get wallet transactions using raw SQL
    const transactions = await prisma.$queryRaw<Transaction[]>`
      SELECT 
        wt.*,
        ba."accountName" as "bankAccountName"
      FROM "WalletTransaction" wt
      LEFT JOIN "Account" ba ON wt."bankAccountId" = ba.id
      WHERE wt."userId" = ${userData.id}
      ORDER BY wt.date DESC
    `;

    // Categorize transactions by status
    const categorizedTransactions = {
      all: transactions,
      pending: transactions.filter((t) => t.status === "PENDING"),
      rejected: transactions.filter((t) => t.status === "FAILED"),
      completed: transactions.filter((t) => t.status === "COMPLETED"),
    };

    return NextResponse.json(categorizedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
