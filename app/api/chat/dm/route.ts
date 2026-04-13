import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/chat/dm
// Crée ou retourne le salon DM privé existant entre deux utilisateurs dans une famille.
// Body: { familyId, targetUserId }
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { familyId, targetUserId } = body;

    if (!familyId || !targetUserId) {
      return NextResponse.json({ error: "familyId and targetUserId are required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot create a DM with yourself" }, { status: 400 });
    }

    // Vérifier que les deux sont membres actifs de la famille
    const [myMember, targetMember] = await Promise.all([
      prisma.member.findFirst({ where: { userId: user.id, familyId, status: "ACTIVE" } }),
      prisma.member.findFirst({ where: { userId: targetUserId, familyId, status: "ACTIVE" } }),
    ]);

    if (!myMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!targetMember) {
      return NextResponse.json({ error: "Target user is not an active member of this family" }, { status: 400 });
    }

    // Chercher un salon PRIVATE dans cette famille où les deux sont participants actifs
    // On filtre isDirect en mémoire (champ ajouté via migration, client à régénérer)
    const candidates = await prisma.chatRoom.findMany({
      where: {
        familyId,
        channelType: "PRIVATE",
        deletedAt: null,
        participants: { some: { userId: user.id, leftAt: null } },
        AND: [{ participants: { some: { userId: targetUserId, leftAt: null } } }],
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, displayName: true, profilePictureUrl: true } },
          },
        },
      },
    });

    // Garder uniquement les salons à exactement 2 participants (= DM)
    const existingRoom = candidates.find((r) => r.participants.length === 2);

    if (existingRoom) {
      return NextResponse.json(existingRoom);
    }

    // Récupérer le displayName de la cible pour nommer le salon
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true },
    });

    // Créer le salon DM
    const room = await prisma.chatRoom.create({
      data: {
        familyId,
        name: targetUser?.displayName ?? "Direct Message",
        channelType: "PRIVATE",
        creatorId: user.id,
        participants: {
          create: [
            { userId: user.id, role: "ADMIN" },
            { userId: targetUserId, role: "MEMBER" },
          ],
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, displayName: true, profilePictureUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get or create DM" }, { status: 500 });
  }
}
