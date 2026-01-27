import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string = body.email;
    const password: string = body.password;
    const name: string | undefined = body.name;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: name,
      },
    });

    // don't return the password hash
    const { passwordHash: _ph, ...safeUser } = newUser as User;

    return NextResponse.json(safeUser as Omit<User, 'passwordHash'>, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);

    // handle unique constraint on email (Prisma P2002)
    const anyErr = error as { code?: string } | undefined;
    if (anyErr?.code === 'P2002') {
      return NextResponse.json({ error: 'Un utilisateur avec cet e-mail existe déjà' }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création", details: message },
      { status: 500 },
    );
  }
}
