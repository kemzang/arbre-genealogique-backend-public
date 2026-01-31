import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, profilePictureUrl } = body;

    // Validation: profilePictureUrl is now REQUIRED
    if (!email || !password || !profilePictureUrl) {
      return NextResponse.json({ 
        error: 'Email, mot de passe et photo de profil sont requis' 
      }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: name,
        profilePictureUrl, // Save the photo URL
      },
    });

    // don't return the password hash
    const { passwordHash: _ph, ...safeUser } = newUser as User;

    return NextResponse.json(safeUser, { status: 201 });
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
