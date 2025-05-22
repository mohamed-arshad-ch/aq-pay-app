import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  confirmPassword: z.string(),
  acceptTerms: z.boolean(),
});

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received registration data:", {
      ...body,
      password: "[REDACTED]",
    });

    const validatedData = registerSchema.parse(body);
    console.log("Validated data:", {
      ...validatedData,
      password: "[REDACTED]",
    });

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      console.log("User already exists:", {
        email: validatedData.email,
        username: validatedData.username,
      });
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Generate verification code
    const verifyToken = generateVerificationCode();
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user with only the required fields
    const userData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword,
      verifyToken,
      verifyTokenExpires,
    };

    console.log("Creating user with data:", {
      ...userData,
      password: "[REDACTED]",
    });

    const user = await prisma.user.create({
      data: userData,
    });

    console.log("User created successfully:", {
      id: user.id,
      email: user.email,
    });

    // Generate auth token
    const token = await generateToken(user);

    // In demo mode, we'll return the verification code in the response
    // In production, this would be sent via email
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
      verifyToken, // Only for demo purposes
      redirectTo: "/auth/verify", // Redirect to verification page
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      console.log("Validation error:", error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
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
