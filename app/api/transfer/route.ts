import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { generateOrderId } from "@/lib/utils";
import { WalletTransactionStatus, WalletTransactionType } from "@/types";

// GET - List all transactions with optional filtering
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    // Build where clause for filtering
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } }
      ];
    }

    // For regular users, only show their own transactions
    if (user.role !== "ADMIN") {
      where.userId = user.id;
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.walletTransaction.count({ where });

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      type,
      description,
      bankAccountId,
      location,
      currency = "USD",
    } = body;

    // Validate required fields
    if (!amount || !type || !description) {
      return NextResponse.json(
        { error: "Missing required fields: amount, type, description" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // For withdrawals, check if user has sufficient balance
    if (type === WalletTransactionType.WITHDRAWAL && wallet.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        orderId: generateOrderId(),
        walletId: wallet.id,
        userId: user.id,
        amount,
        currency,
        type: type as WalletTransactionType,
        status: WalletTransactionStatus.PENDING,
        description,
        bankAccountId: bankAccountId || null,
        location: location || null,
        date: new Date().toISOString(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
          },
        },
      },
    });

    // For deposits, automatically approve and update wallet balance
    if (type === WalletTransactionType.DEPOSIT) {
      const updatedTransaction = await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: WalletTransactionStatus.COMPLETED },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              accountNumber: true,
              bankName: true,
            },
          },
        },
      });

      // Update wallet balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + amount },
      });

      return NextResponse.json({
        transaction: updatedTransaction,
        message: "Deposit transaction created and approved successfully",
      });
    }

    return NextResponse.json({
      transaction,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
} 