import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_EXPIRATION_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Toujours retourner un message générique pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json(
        {
          message:
            "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
        },
        { status: 200 },
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000,
    );

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Envoyer l'email de réinitialisation
    try {
      await sendPasswordResetEmail(email, token);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("forgot-password error", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de réinitialisation" },
      { status: 500 },
    );
  }
}

