import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
<<<<<<< HEAD
import { WalletTransactionStatus } from "@/types";
=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521

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

<<<<<<< HEAD
    const id = await params.id;

=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
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
<<<<<<< HEAD
      WHERE wt.id = ${id}
    `;

    if (
      !transaction ||
      !Array.isArray(transaction) ||
      transaction.length === 0
    ) {
=======
      WHERE wt.id = ${params.id}
    `;

    if (!transaction || !transaction[0]) {
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
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

<<<<<<< HEAD
    const id = await params.id;
    const body = await request.json();
    const { status, amount, location, date } = body;

    // Validate status
    if (!Object.values(WalletTransactionStatus).includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    // Get the current transaction
    const currentTransaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!currentTransaction) {
      return new NextResponse("Transaction not found", { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    }
    if (location !== undefined) {
      updateData.location = location;
    }
    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    // Update the transaction
    const updatedTransaction = await prisma.walletTransaction.update({
      where: { id },
      data: updateData,
      include: {
        wallet: true,
      },
    });

    // If the transaction is being marked as completed, update the wallet balance
    if (
      status === WalletTransactionStatus.COMPLETED &&
      currentTransaction.status !== WalletTransactionStatus.COMPLETED
    ) {
      const totalAmount =
        updatedTransaction.amount + (updatedTransaction.fee || 0);

      // Update wallet balance
      await prisma.wallet.update({
        where: { id: currentTransaction.walletId },
        data: {
          balance: {
            increment: totalAmount,
          },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      transaction: updatedTransaction,
      walletUpdated: status === WalletTransactionStatus.COMPLETED,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
=======
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
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
  }
}
