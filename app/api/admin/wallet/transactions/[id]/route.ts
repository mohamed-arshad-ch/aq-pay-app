import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
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
      WHERE wt.id = ${params.id}
    `;

    if (!transaction || !transaction[0]) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction[0]);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const { status } = await request.json();

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the transaction and wallet
      const transaction = await tx.walletTransaction.findUnique({
        where: { id: params.id },
        include: { wallet: true },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "PENDING") {
        throw new Error("Transaction is not pending");
      }

      // Update transaction status
      const updatedTransaction = await tx.walletTransaction.update({
        where: { id: params.id },
        data: { status },
        include: {
          user: true,
          bankAccount: true,
        },
      });

      // If the transaction is approved and it's a SEND type, deduct from wallet balance
      if (status === "COMPLETED" && transaction.type === "SEND") {
        const wallet = await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              decrement: transaction.amount,
            },
          },
        });

        return {
          ...updatedTransaction,
          wallet,
        };
      }

      return updatedTransaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
