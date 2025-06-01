import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { WalletTransactionStatus, WalletTransactionType } from "@/types";

// GET - Get transaction details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const transaction = await prisma.walletTransaction.findMany({
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

    console.log(transaction);
    

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found " + id  + transaction},
        { status: 404 }
      );
    }

    // Regular users can only view their own transactions
    // if (user.role !== "ADMIN" && transaction.userId !== user.id) {
    //   return NextResponse.json(
    //     { error: "Access denied" },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json({ transaction: transaction[0] });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update transaction details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only admins can update transactions
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { amount, description, location, date } = body;

    // Check if transaction exists
    const existingTransaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Only allow updates for pending transactions
    if (existingTransaction.status !== WalletTransactionStatus.PENDING) {
      return NextResponse.json(
        { error: "Can only update pending transactions" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) updateData.date = date;
   
    
    updateData.updatedAt = new Date().toISOString();

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

    return NextResponse.json({
      transaction: updatedTransaction,
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// POST - Update transaction status (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, amount, description, location, date } = body;

    // Validate status
    if (!Object.values(WalletTransactionStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get transaction with wallet details
    const transaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: {
        wallet: true,
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

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Only allow status updates for pending transactions
    if (transaction.status !== WalletTransactionStatus.PENDING) {
      return NextResponse.json(
        { error: "Can only update status of pending transactions" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) updateData.date = date;

    // Handle wallet balance updates based on status
    let walletBalanceUpdate = null;

    if (status === WalletTransactionStatus.COMPLETED) {
      if (transaction.type === WalletTransactionType.DEPOSIT) {
        // Add to wallet balance for approved deposits
        const finalAmount = amount || transaction.amount;
        walletBalanceUpdate = {
          balance: transaction.wallet.balance + finalAmount,
        };
      } else if (transaction.type === WalletTransactionType.WITHDRAWAL) {
        // Deduct from wallet balance for approved withdrawals
        const finalAmount = amount || transaction.amount;
        if (transaction.wallet.balance < finalAmount) {
          return NextResponse.json(
            { error: "Insufficient wallet balance" },
            { status: 400 }
          );
        }
        walletBalanceUpdate = {
          balance: transaction.wallet.balance - finalAmount,
        };
      }
    }

    // Update transaction in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update the transaction
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

      // Update wallet balance if needed
      if (walletBalanceUpdate) {
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: walletBalanceUpdate,
        });
      }

      return updatedTransaction;
    });

    const message = status === WalletTransactionStatus.COMPLETED 
      ? "Transaction approved successfully" 
      : status === WalletTransactionStatus.CANCELLED
      ? "Transaction rejected successfully"
      : "Transaction status updated successfully";

    return NextResponse.json({
      transaction: result,
      message,
      walletUpdated: !!walletBalanceUpdate,
      newBalance: walletBalanceUpdate ? walletBalanceUpdate.balance : undefined,
    });
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Failed to update transaction status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only admins can delete transactions
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if transaction exists
    const transaction = await prisma.walletTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of pending or failed transactions
    if (![WalletTransactionStatus.PENDING, WalletTransactionStatus.FAILED].includes(transaction.status as WalletTransactionStatus)) {
      return NextResponse.json(
        { error: "Can only delete pending or failed transactions" },
        { status: 400 }
      );
    }

    await prisma.walletTransaction.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
} 