import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { WalletTransaction } from "@prisma/client";

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string | null;
  fee: number;
  bankAccountId: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  location: string | null;
  accountHolderName?: string;
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
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { userId: userData.id },
      include: { bankAccount: { select: { accountHolderName: true } } },
    });

    const transactions: Transaction[] = walletTransactions.map((wt) => ({
      id: wt.id,
      userId: userData.id,
      walletId: wt.walletId,
      amount: wt.amount,
      currency: wt.currency,
      type: wt.type,
      status: wt.status,
      description: wt.description,
      fee: wt.fee,
      bankAccountId: wt.bankAccountId,
      date: wt.date,
      createdAt: wt.createdAt,
      updatedAt: wt.updatedAt,
      location: null,
      bankAccountName: wt.bankAccount?.accountHolderName,
    }));

    if (!Array.isArray(transactions)) {
      return new NextResponse("Invalid transaction data", { status: 500 });
    }

    const sortedTransactions = transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(sortedTransactions, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
