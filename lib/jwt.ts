import { SignJWT, jwtVerify } from "jose";
import type { User } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Convert the secret to Uint8Array
const secret = new TextEncoder().encode(JWT_SECRET);

export async function generateToken(user: User) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      id: string;
      email: string;
      username: string;
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}
