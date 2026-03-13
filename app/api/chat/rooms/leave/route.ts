import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chatRoomId } = body;

    if (!chatRoomId) {
      return NextResponse.json({ 
        error: "Paramètre manquant",
        message: "L'identifiant du salon (chatRoomId) est requis.",
        reason: "MISSING_PARAMETER"
      }, { status: 400 });
    }

    // Verify room exists and get active admin count
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!room) {
      return NextResponse.json({ 
        error: "Salon introuvable",
        message: "Le salon de discussion demandé n'existe pas.",
        reason: "ROOM_NOT_FOUND"
      }, { status: 404 });
    }

    // Check if user is an active participant
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: { 
        chatRoomId, 
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ 
        error: "Accès refusé",
        message: "Vous n'êtes pas membre de ce salon de discussion.",
        reason: "NOT_PARTICIPANT"
      }, { status: 403 });
    }

    // Check if already left
    if (participant.leftAt !== null) {
      return NextResponse.json({ 
        error: "Action impossible",
        message: "Vous avez déjà quitté ce salon.",
        reason: "ALREADY_LEFT"
      }, { status: 400 });
    }

    // Prevent last admin from leaving
    if (participant.role === "ADMIN") {
      const activeAdmins = await prisma.chatRoomParticipant.findMany({
        where: {
          chatRoomId,
          role: "ADMIN"
        }
      });

      // Count admins who haven't left
      const activeAdminCount = activeAdmins.filter(a => a.leftAt === null).length;

      if (activeAdminCount === 1) {
        return NextResponse.json({ 
          error: "Impossible de quitter le salon",
          message: "Vous êtes le dernier administrateur de ce salon. Vous devez d'abord promouvoir un autre membre comme administrateur avant de pouvoir quitter, ou supprimer le salon.",
          reason: "LAST_ADMIN"
        }, { status: 403 });
      }
    }

    // Mark participant as left (soft delete)
    await prisma.chatRoomParticipant.update({
      where: {
        chatRoomId_userId: {
          chatRoomId,
          userId: user.id
        }
      },
      data: {
        leftAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Vous avez quitté le salon avec succès." 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to leave chat room" }, { status: 500 });
  }
}
