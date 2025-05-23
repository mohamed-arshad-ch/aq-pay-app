import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { User } from "@/types";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export async function generateToken(user: User) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role || "USER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return token;
}

export async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  } catch (err) {
    throw new Error("Invalid token");
  }
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  return token?.value;
}

export async function verifyToken(token: string) {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  } catch (err) {
    return null;
  }
}
