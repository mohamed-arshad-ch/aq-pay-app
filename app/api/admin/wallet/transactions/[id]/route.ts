import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { WalletTransactionStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("API Route called with ID:", id);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token?.value) {
      console.log("No auth token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await verifyToken(token.value);
    if (!userData) {
      console.log("Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("Fetching transaction with ID:", id);

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

    console.log("Query result:", transaction);

    if (!transaction || !Array.isArray(transaction) || transaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction[0]);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("Updating transaction with ID:", id);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await verifyToken(token.value);
    if (!userData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { status, amount, location, date, reason } = body;
    console.log("Request body:", body);

    // Validate status if provided
    if (status && !Object.values(WalletTransactionStatus).includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: PENDING, COMPLETED, REJECTED, CANCELLED",
        },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Validate date if provided
    let parsedDate: Date | undefined;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
    }

    // First, get the current transaction outside the transaction block
    const currentTransaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { 
        wallet: true,
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
          },
        },
      },
    });

    if (!currentTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    console.log("Current transaction:", currentTransaction);

    // Use a transaction for atomic updates
    const result = await prisma.$transaction(async (tx) => {
      let walletUpdate = {};

      // Handle balance updates only if status is changing to COMPLETED or from COMPLETED
      if (status === "COMPLETED" && currentTransaction.status !== "COMPLETED") {
        if (currentTransaction.type === "DEPOSIT") {
          walletUpdate = {
            balance: {
              increment: amount ?? currentTransaction.amount,
            },
          };
        } else if (currentTransaction.type === "WITHDRAWAL") {
          // Check for sufficient balance
          const wallet = await tx.wallet.findUnique({
            where: { id: currentTransaction.walletId },
          });
          if (!wallet || wallet.balance < (amount ?? currentTransaction.amount)) {
            throw new Error("Insufficient wallet balance");
          }
          walletUpdate = {
            balance: {
              decrement: amount ?? currentTransaction.amount,
            },
          };
        }
      } else if (currentTransaction.status === "COMPLETED" && status !== "COMPLETED") {
        // Reversing a completed transaction
        if (currentTransaction.type === "DEPOSIT") {
          walletUpdate = {
            balance: {
              decrement: currentTransaction.amount,
            },
          };
        } else if (currentTransaction.type === "WITHDRAWAL") {
          walletUpdate = {
            balance: {
              increment: currentTransaction.amount,
            },
          };
        }
      }

      // Update wallet if needed
      if (Object.keys(walletUpdate).length > 0) {
        await tx.wallet.update({
          where: { id: currentTransaction.walletId },
          data: walletUpdate,
        });
      }

      // Update the transaction
      const updatedTransaction = await tx.walletTransaction.update({
        where: { id },
        data: {
          status: status ?? currentTransaction.status,
          amount: amount ?? currentTransaction.amount,
          location: location ?? currentTransaction.location,
          date: parsedDate ?? currentTransaction.date,
          updatedAt: new Date(),
          ...(reason && { reason }), // Include reason if provided (e.g., for rejections)
        },
        include: {
          wallet: true,
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
            },
          },
        },
      });

      return updatedTransaction;
    });

    console.log("Transaction updated successfully:", result);

    // Return just the transaction object (not wrapped in another object)
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating transaction:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('P2028')) {
        return NextResponse.json(
          { error: "Transaction is no longer available for updates" },
          { status: 409 }
        );
      }
      if (error.message.includes('P2025')) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
      if (error.message.includes('Insufficient wallet balance')) {
        return NextResponse.json(
          { error: "Insufficient wallet balance" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: (error as Error).message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}