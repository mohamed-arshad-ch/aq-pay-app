// app/api/wallet/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// Get wallet details (No changes here)
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

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: userData.id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: userData.id,
          balance: 0,
          currency: "USD",
        },
        include: {
          transactions: {
            orderBy: { date: "desc" },
            take: 5,
          },
        },
      });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Deposit to wallet (Modified)
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

    const { amount, description, status, location, time } =
      await request.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get or create wallet (No change needed here, as we still need the walletId)
    let wallet = await prisma.wallet.findUnique({
      where: { userId: userData.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: userData.id,
          balance: 0,
          currency: "USD",
        },
      });
    }

    // Create transaction with PENDING status.
    // **DO NOT update wallet balance here.**
    const newTransaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: userData.id,
        amount,
        currency: wallet.currency,
        type: "DEPOSIT",
        status: status || "PENDING", // Ensure it's PENDING initially
        description: description || "Wallet deposit",
        date: time || new Date().toISOString(),
        location: location || undefined,
      },
    });

    // Return the created transaction. The balance will not be part of this response for pending transactions.
    return NextResponse.json({ transaction: newTransaction }); // Wrap in an object for clarity
  } catch (error) {
    console.error("Error processing deposit:", error);
    return NextResponse.json(
      { error: "Failed to process deposit" },
      { status: 500 }
    );
  }
}