import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { WalletTransactionStatus } from "@/types";

// POST - Update transaction status
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

    // Only admins can update transaction status
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only admins can update transaction status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, transactionId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = [
      WalletTransactionStatus.COMPLETED,
      WalletTransactionStatus.PENDING,
      WalletTransactionStatus.PROCESSING,
      WalletTransactionStatus.CANCELLED,
      WalletTransactionStatus.FAILED
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: COMPLETED, PENDING, PROCESSING, CANCELLED, FAILED" },
        { status: 400 }
      );
    }

    // If updating to PROCESSING status, transactionId is required
    if (status === WalletTransactionStatus.PROCESSING && !transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required when updating status to PROCESSING" },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        wallet: true,
        bankAccount: {
          select: {
            id: true,
            accountHolderName: true,
            accountNumber: true,
            ifscCode: true,
          },
        },
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add transactionId if provided (for PROCESSING status)
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    // Update transaction status
    const updatedTransaction = await prisma.walletTransaction.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        wallet: true,
        bankAccount: {
          select: {
            id: true,
            accountHolderName: true,
            accountNumber: true,
            ifscCode: true,
          },
        },
      },
    });

    // If transaction is being completed and it's a deposit, update wallet balance
    let walletUpdated = false;
    let newBalance = null;

    if (status === WalletTransactionStatus.COMPLETED && 
        existingTransaction.status !== WalletTransactionStatus.COMPLETED &&
        existingTransaction.type === "DEPOSIT" && 
        existingTransaction.wallet) {
      
      const updatedWallet = await prisma.wallet.update({
        where: { id: existingTransaction.wallet.id },
        data: {
          balance: {
            increment: existingTransaction.amount
          },
          updatedAt: new Date(),
        },
      });
      
      walletUpdated = true;
      newBalance = updatedWallet.balance;
    }

    // If transaction is being completed and it's a withdrawal, update wallet balance
    if (status === WalletTransactionStatus.COMPLETED && 
        existingTransaction.status !== WalletTransactionStatus.COMPLETED &&
        existingTransaction.type === "WITHDRAWAL" && 
        existingTransaction.wallet) {
      
      // Check if wallet has sufficient balance
      if (existingTransaction.wallet.balance < existingTransaction.amount) {
        return NextResponse.json(
          { error: "Insufficient wallet balance for withdrawal" },
          { status: 400 }
        );
      }

      const updatedWallet = await prisma.wallet.update({
        where: { id: existingTransaction.wallet.id },
        data: {
          balance: {
            decrement: existingTransaction.amount
          },
          updatedAt: new Date(),
        },
      });
      
      walletUpdated = true;
      newBalance = updatedWallet.balance;
    }

    return NextResponse.json({
      transaction: updatedTransaction,
      message: `Transaction status updated to ${status}`,
      walletUpdated,
      newBalance,
    });

  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Failed to update transaction status" },
      { status: 500 }
    );
  }
} 