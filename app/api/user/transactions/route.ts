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

    // Get both wallet and bank transactions
    const [walletTransactions, bankTransactions] = await Promise.all([
      prisma.$queryRaw<Transaction[]>`
        SELECT 
          wt.*,
          ba."accountName" as "bankAccountName"
        FROM "WalletTransaction" wt
        LEFT JOIN "Account" ba ON wt."bankAccountId" = ba.id
        WHERE wt."userId" = ${userData.id}
      `,
      prisma.$queryRaw<Transaction[]>`
        SELECT 
          t.*,
          fromAccount."accountName" as "fromAccountName",
          toAccount."accountName" as "toAccountName"
        FROM "Transaction" t
        LEFT JOIN "Account" fromAccount ON t."fromAccountId" = fromAccount.id
        LEFT JOIN "Account" toAccount ON t."toAccountId" = toAccount.id
        WHERE t."userId" = ${userData.id}
      `
    ]);

    // Combine both types of transactions
    const allTransactions = [...walletTransactions, ...bankTransactions];

    // Sort transactions by date in descending order
    const sortedTransactions = allTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Categorize transactions by status
    // Categorize transactions by status
    const categorizedTransactions = {
      all: sortedTransactions,
      pending: sortedTransactions.filter((t: Transaction) => t.status === "PENDING"),
      rejected: sortedTransactions.filter((t: Transaction) => t.status === "FAILED"),
      completed: sortedTransactions.filter((t: Transaction) => t.status === "COMPLETED"),
    };

    return NextResponse.json(categorizedTransactions);

    return NextResponse.json(categorizedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
