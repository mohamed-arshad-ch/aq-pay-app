import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// Get account details by ID using POST request
export async function POST(
  request: NextRequest
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Use the ID from the request body
    const account = await prisma.account.findUnique({
      where: {
        id,
        userId: userData.id,
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

    // Add debug logging
    console.log('Found account:', {
      id: account.id,
      accountName: account.accountName,
      accountNumber: account.accountNumber
    });

    // Ensure we're returning a proper JSON response
    return NextResponse.json({
      account: {
        ...account,
        // Convert Prisma's Decimal type to string for accountNumber
        accountNumber: account.accountNumber.toString(),
        // Convert Prisma's DateTime type to string for createdAt, updatedAt
        createdAt: account.createdAt?.toISOString(),
        updatedAt: account.updatedAt?.toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// Update an account
export async function PUT(
  request: NextRequest
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

    const body = await request.json();
    const { id, isDefault, accountName, accountType, accountHolderName, ifscCode, routingNumber, branchName, currency } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id,
        userId: userData.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // If setting as default, unset other default accounts for the user
    if (isDefault === true) {
      await prisma.account.updateMany({
        where: {
          userId: userData.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: {
        id,
      },
      data: {
        isDefault,
        accountName,
        accountType,
        accountHolderName,
        ifscCode,
        routingNumber,
        branchName,
        currency,
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

// Delete an account
export async function DELETE(
  request: NextRequest
) {
  try {
    console.log('DELETE request received');
    
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    console.log('Auth token:', token?.value ? 'Present' : 'Missing');

    if (!token?.value) {
      console.error('No auth token found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await verifyToken(token.value);
    if (!userData) {
      console.error('Invalid token verification');
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log('Authenticated user:', userData.id);
    
    const body = await request.json();
    console.log('Request body:', body);
    const { id } = body;

    if (!id) {
      console.error('No account ID provided');
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // First check if the account exists and belongs to the user
    const account = await prisma.account.findUnique({
      where: {
        id,
        userId: userData.id,
      },
    });

    if (!account) {
      console.error('Account not found for user:', userData.id);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Then delete the account
    await prisma.account.delete({
      where: {
        id,
        userId: userData.id,
      },
    });

    console.log('Account deleted successfully:', id);
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}