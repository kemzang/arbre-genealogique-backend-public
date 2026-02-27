import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token: string | undefined = body?.token;
    const password: string | undefined = body?.password;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token de réinitialisation requis" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Nouveau mot de passe invalide (minimum 8 caractères)" },
        { status: 400 },
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    const now = new Date();

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < now
    ) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur associé introuvable" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json(
      { message: "Mot de passe mis à jour avec succès" },
      { status: 200 },
    );
  } catch (error) {
    console.error("reset-password error", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 },
    );
  }
}

