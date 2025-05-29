import { NextResponse } from "next/server";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import type { User } from "@/types";
import { UserStatus } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, rememberMe } = body;

    // Check admin credentials
    if (username === "admin" && password === "Admin123") {
      // Create admin user object
      const adminUser: User = {
        id: "admin",
        username: "admin",
        email: "admin@gmail.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        password: "",
        phoneNumber: "",
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        twoFactorEnabled: false,
        notificationPreferences: {
          transactions: true,
          balanceUpdates: true,
          securityAlerts: true,
          marketing: false,
        },
        appPreferences: {
          language: "en",
          theme: "light",
          defaultCurrency: "USD",
        },
        verificationStatus: "verified",
        verificationDocuments: [],
        status: UserStatus.ACTIVE,
      };

      // Generate token
      const token = await generateToken(adminUser);

      // Create response
      const response = NextResponse.json({
        user: adminUser,
        token,
      });

      // Set cookie
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid admin credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
