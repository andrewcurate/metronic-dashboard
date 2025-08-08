import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body?.name ?? "").trim() as string;
    const email = (body?.email ?? "").trim().toLowerCase() as string;
    const password = body?.password as string;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Ensure user doesn't already exist
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 400 }
      );
    }

    // Find a role to assign:
    // 1) default role (isDefault = true)
    // 2) fallback by common name/slug "User"
    let role = await prisma.userRole.findFirst({
      where: { isDefault: true, isTrashed: false },
      select: { id: true },
    });

    if (!role) {
      role = await prisma.userRole.findFirst({
        where: {
          isTrashed: false,
          OR: [{ name: "User" }, { slug: "user" }],
        },
        select: { id: true },
      });
    }

    if (!role) {
      // No usable role found — instruct to seed one
      return NextResponse.json(
        {
          message:
            "No default role found. Please create a UserRole with isDefault=true (or name/slug 'User').",
        },
        { status: 500 }
      );
    }

    // Hash password (schema allows password to be nullable, but we require it here)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and connect required role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: { connect: { id: role.id } },
      },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
