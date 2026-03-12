import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        profilePictureUrl: true,
        createdAt: true,
        isSuperAdmin: true,
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier le profil de l'utilisateur connecté
export async function PATCH(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, profilePictureUrl, currentPassword, newPassword } = body;

    // Préparer les données à mettre à jour
    const updateData: {
      displayName?: string;
      profilePictureUrl?: string;
      passwordHash?: string;
    } = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    // Si l'utilisateur veut changer son mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Le mot de passe actuel est requis pour changer le mot de passe' 
        }, { status: 400 });
      }

      // Vérifier le mot de passe actuel
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true }
      });

      if (!userWithPassword) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ 
          error: 'Mot de passe actuel incorrect' 
        }, { status: 400 });
      }

      // Hasher le nouveau mot de passe
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        profilePictureUrl: true,
        createdAt: true,
        isSuperAdmin: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du profil' 
    }, { status: 500 });
  }
}
