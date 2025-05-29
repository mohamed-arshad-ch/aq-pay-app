import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function POST(request: Request) {
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

    const { amount, bankAccountId, description } = await request.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { error: "Bank account is required" },
        { status: 400 }
      );
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userData.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Verify bank account belongs to user
    const bankAccount = await prisma.account.findFirst({
      where: {
        id: bankAccountId,
        userId: userData.id,
      },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }

    // Create transaction and update wallet balance in a transaction
    const result = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: userData.id,
          amount,
          currency: wallet.currency,
          type: "WITHDRAWAL",
          status: "PENDING",
          description: description || "Send to bank account",
          bankAccountId,
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
    ]);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error processing send request:", error);
    return NextResponse.json(
      { error: "Failed to process send request" },
      { status: 500 }
    );
  }
}
