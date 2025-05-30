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

    // Check if user is admin (add this check based on your user model)
    // if (userData.role !== 'ADMIN') {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // Get ALL transactions for admin dashboard (not filtered by userId)
    const transactions = await prisma.walletTransaction.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get additional stats for admin dashboard
    const totalUsers = await prisma.user.count();
    
    const transactionStats = await prisma.walletTransaction.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Calculate transaction volume
    const transactionVolume = await prisma.walletTransaction.aggregate({
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      transactions,
      totalUsers,
      transactionStats,
      transactionVolume: transactionVolume._sum.amount || 0,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}