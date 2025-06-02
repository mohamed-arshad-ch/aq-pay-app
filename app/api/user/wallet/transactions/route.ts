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

    // Get wallet transactions for the logged-in user using Prisma's raw query
    const transactions = await prisma.$queryRaw`
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
          'accountHolderName', ba."accountHolderName",
          'accountNumber', ba."accountNumber",
          'ifscCode', ba."ifscCode"
         
        ) as "bankAccount"
      FROM "WalletTransaction" wt
      LEFT JOIN "User" u ON wt."userId" = u.id
      LEFT JOIN "Account" ba ON wt."bankAccountId" = ba.id
      WHERE wt."userId" = ${userData.id}
      ORDER BY wt.date DESC
    `;

    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "get":
        // Get specific wallet transaction
        const transaction = await prisma.walletTransaction.findUnique({
          where: {
            id: id,
            userId: userData.id,
          },
          include: {
            bankAccount: true,
          },
        });

        if (!transaction) {
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          transaction
        });

      case "update":
        const { status, notes } = body;
        
        if (!status) {
          return NextResponse.json(
            { error: "Status is required for update" },
            { status: 400 }
          );
        }

        const updatedTransaction = await prisma.walletTransaction.update({
          where: {
            id: id,
            userId: userData.id,
          },
          data: {
            status,
            ...(notes && { notes }),
          },
          include: {
            bankAccount: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Transaction updated successfully",
          transaction: updatedTransaction
        });

      case "delete":
        await prisma.walletTransaction.delete({
          where: {
            id: id,
            userId: userData.id,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Transaction deleted successfully"
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'get', 'update', or 'delete'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error handling wallet transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
