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

    // Get recent transactions
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: {
        userId: userData.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bankAccount: true,
      },
    });

    console.log("API - Found transactions:", recentTransactions); // Debug log

    return NextResponse.json({
      recentTransactions,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
