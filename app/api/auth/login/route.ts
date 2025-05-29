import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { z } from "zod";
import { cookies } from "next/headers";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received login data:", {
      ...body,
      password: "[REDACTED]",
    });

    const validatedData = loginSchema.parse(body);
    console.log("Validated data:", {
      ...validatedData,
      password: "[REDACTED]",
    });

    // Find user by username
    const user = await prisma.user.findUnique({
      where: {
        username: validatedData.username,
      },
    });

    if (!user) {
      console.log("User not found:", validatedData.username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(
      validatedData.password,
      user.password
    );
    if (!isValidPassword) {
      console.log("Invalid password for user:", validatedData.username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate auth token
    const token = await generateToken(user);

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      token,
    });

    // Set auth token cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: validatedData.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

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
