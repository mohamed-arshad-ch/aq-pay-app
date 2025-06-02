import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// Handle all account operations through POST requests
export async function POST(request: NextRequest) {
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
    const { action, id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case "get":
      case undefined: // Default action for backward compatibility
        return await handleGetAccount(id, userData.id);
      
      case "update":
        return await handleUpdateAccount(id, userData.id, body);
      
      case "delete":
        return await handleDeleteAccount(id, userData.id);
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: get, update, delete" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in account details API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get account details
async function handleGetAccount(accountId: string, userId: string) {
  try {
    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
        userId: userId,
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
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    console.log('Found account:', {
      id: account.id,
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber
    });

    return NextResponse.json({
      ...account,
      createdAt: account.createdAt?.toISOString(),
      updatedAt: account.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// Update account
async function handleUpdateAccount(accountId: string, userId: string, body: any) {
  try {
    const { accountHolderName, accountNumber, ifscCode } = body;

    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        accountHolderName,
        accountNumber,
        ifscCode,
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// Delete account
async function handleDeleteAccount(accountId: string, userId: string) {
  try {
    console.log('DELETE request for account:', accountId);
    
    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
      },
    });

    if (!existingAccount) {
      console.error('Account not found for user:', userId);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    console.log('Found account to delete:', existingAccount.id);

    // Delete the account
    await prisma.account.delete({
      where: {
        id: accountId,
      },
    });

    console.log('Account deleted successfully');
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}