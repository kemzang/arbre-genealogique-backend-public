import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = idStr;

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        _count: { select: { messages: true } },
        participants: {
          where: { leftAt: null },
          include: {
            user: { 
              select: { 
                id: true, 
                displayName: true,
                email: true,
                profilePictureUrl: true
              } 
            }
          },
          orderBy: [
            { role: 'asc' }, // ADMIN first
            { joinedAt: 'asc' }
          ]
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            profilePictureUrl: true
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // Verify user is an active member of the family
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: room.familyId, 
        status: "ACTIVE" 
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For private rooms, verify user is an active participant
    if (room.channelType === "PRIVATE") {
      const isParticipant = room.participants.some(p => p.userId === user.id && p.leftAt === null);
      if (!isParticipant) {
        return NextResponse.json({ 
          error: "Forbidden: You are not a participant of this private room" 
        }, { status: 403 });
      }
    }

    return NextResponse.json(room);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch chat room" }, { status: 500 });
  }
}
