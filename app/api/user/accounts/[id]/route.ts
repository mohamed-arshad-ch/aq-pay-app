import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// Get account details by ID using POST request
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ account });
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
  req: Request,
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

    const data = await req.json();

    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: userData.id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // If setting as default, unset other default accounts for the user
    if (data.isDefault === true) {
      await prisma.account.updateMany({
        where: {
          userId: userData.id,
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: {
        id: params.id,
      },
      data: {
        isDefault: data.isDefault,
        // Include other fields that can be updated
        ...(data.accountName && { accountName: data.accountName }),
        ...(data.accountType && { accountType: data.accountType }),
        ...(data.accountHolderName && { accountHolderName: data.accountHolderName }),
        ...(data.ifscCode && { ifscCode: data.ifscCode }),
        ...(data.routingNumber && { routingNumber: data.routingNumber }),
        ...(data.branchName && { branchName: data.branchName }),
        ...(data.currency && { currency: data.currency }),
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

    // First check if the account exists and belongs to the user
    const account = await prisma.account.findUnique({
      where: {
        id: params.id,
        userId: userData.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Then delete the account
    await prisma.account.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}