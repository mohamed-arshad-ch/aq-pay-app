import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { WalletTransactionStatus } from "@/types";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API Route called with ID:', params.id);
    
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token?.value) {
      console.log('No auth token found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await verifyToken(token.value);
    if (!userData) {
      console.log('Invalid token');
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const id = params.id;
    console.log('Fetching transaction with ID:', id);

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const transaction = await prisma.$queryRaw`
      SELECT 
        wt.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email
        ) as user,
        json_build_object(
          'id', ba.id,
          'accountName', ba."accountName",
          'accountNumber', ba."accountNumber",
          'bankName', ba."bankName"
        ) as "bankAccount"
      FROM "WalletTransaction" wt
      LEFT JOIN "User" u ON wt."userId" = u.id
      LEFT JOIN "Account" ba ON wt."bankAccountId" = ba.id
      WHERE wt.id = ${id}
    `;

    console.log('Query result:', transaction);

    if (
      !transaction ||
      !Array.isArray(transaction) ||
      transaction.length === 0
    ) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction[0]);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const id = params.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(WalletTransactionStatus).includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: PENDING, COMPLETED, REJECTED",
        },
        { status: 400 }
      );
    }

    // Get the current transaction
    const currentTransaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!currentTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Start a transaction to ensure wallet balance is updated atomically
    const result = await prisma.$transaction(async (prisma) => {
      let walletUpdate = {};

      // Only update wallet balance if status is changing to COMPLETED
      if (status === "COMPLETED" && currentTransaction.status !== "COMPLETED") {
        // For deposits, add to wallet balance
        if (currentTransaction.type === "DEPOSIT") {
          walletUpdate = {
            balance: {
              increment: currentTransaction.amount,
            },
          };
        }
        // For withdrawals, subtract from wallet balance
        else if (currentTransaction.type === "WITHDRAWAL") {
          walletUpdate = {
            balance: {
              decrement: currentTransaction.amount,
            },
          };
        }

        // Update wallet if needed
        if (Object.keys(walletUpdate).length > 0) {
          await prisma.wallet.update({
            where: { id: currentTransaction.walletId },
            data: walletUpdate,
          });
        }
      }

      // If changing from COMPLETED to another status, reverse the balance change
      if (currentTransaction.status === "COMPLETED" && status !== "COMPLETED") {
        // For deposits, subtract from wallet balance
        if (currentTransaction.type === "DEPOSIT") {
          walletUpdate = {
            balance: {
              decrement: currentTransaction.amount,
            },
          };
        }
        // For withdrawals, add back to wallet balance
        else if (currentTransaction.type === "WITHDRAWAL") {
          walletUpdate = {
            balance: {
              increment: currentTransaction.amount,
            },
          };
        }

        // Update wallet if needed
        if (Object.keys(walletUpdate).length > 0) {
          await prisma.wallet.update({
            where: { id: currentTransaction.walletId },
            data: walletUpdate,
          });
        }
      }

      // Update the transaction
      const updatedTransaction = await prisma.walletTransaction.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          wallet: true,
          user: true,
          bankAccount: true,
        },
      });

      return updatedTransaction;
    });

    return NextResponse.json({
      transaction: result,
      message: `Transaction ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
