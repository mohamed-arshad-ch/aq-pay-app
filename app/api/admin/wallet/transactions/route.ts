import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await verifyToken(token.value);
    if (!userData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
            accountType: true,
            accountHolderName: true,
            routingNumber: true,
            ifscCode: true,
            branchName: true,
            isDefault: true,
            createdAt: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        },
      },
    });

    // Format the transactions for display
    const formattedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      bankAccount: transaction.bankAccount ? {
        ...transaction.bankAccount,
        accountNumber: transaction.bankAccount.accountNumber.replace(/(.{4})/g, '$1 ').trim(), // Format account number with spaces
        accountHolderName: transaction.bankAccount.accountHolderName || "N/A",
        routingNumber: transaction.bankAccount.routingNumber || "N/A",
        ifscCode: transaction.bankAccount.ifscCode || "N/A",
        branchName: transaction.bankAccount.branchName || "N/A",
        isDefault: transaction.bankAccount.isDefault,
      } : null,
      amount: transaction.amount.toFixed(2),
      fee: transaction.fee.toFixed(2),
      walletBalance: transaction.wallet?.balance ? transaction.wallet.balance.toFixed(2) : 0,
      formattedDate: new Date(transaction.date).toLocaleString(),
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
