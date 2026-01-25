import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string = body.email;
    const password: string = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 },
      );

    const isValid = await bcrypt.compare(password, user.passwordHash ?? "");
    if (!isValid)
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 },
      );

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET in environment");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });

    const { passwordHash: _ph, ...safeUser } = user as any;
    return NextResponse.json({ token, user: safeUser }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
