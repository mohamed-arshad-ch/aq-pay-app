import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateToken } from "@/lib/jwt";

const verifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received verification data:", body);

    const validatedData = verifySchema.parse(body);

    // Find user by verification code
    const user = await prisma.user.findFirst({
      where: {
        verifyToken: validatedData.code,
        verifyTokenExpires: {
          gt: new Date(), // Check if token hasn't expired
        },
      },
    });

    if (!user) {
      console.log("Invalid or expired verification code");
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });

    console.log("Email verified successfully for:", user.email);

    // Generate auth token for automatic login
    const token = await generateToken(user);

    // Create response
    const response = NextResponse.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true,
      },
      token,
    });

    // Set auth token cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Verification error:", error);

    if (error instanceof z.ZodError) {
      console.log("Validation error:", error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Something went wrong",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
