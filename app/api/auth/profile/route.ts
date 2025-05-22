import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
})

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0]

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0]

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if email or username is already taken
    if (validatedData.email || validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: decoded.id } },
            {
              OR: [
                { email: validatedData.email },
                { username: validatedData.username },
              ],
            },
          ],
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email or username already taken' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}