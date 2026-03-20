import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const familyIdParam = url.searchParams.get("familyId");
    
    if (!familyIdParam) {
      return NextResponse.json({ error: "familyId required" }, { status: 400 });
    }
    const familyId = familyIdParam;

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: familyId, status: "ACTIVE" },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only show rooms where user is an active participant (leftAt is null)
    const rooms = await prisma.chatRoom.findMany({
      where: {
        familyId,
        deletedAt: null,
        participants: {
          some: { 
            userId: user.id,
            leftAt: null
          }
        }
      },
      include: {
        _count: { select: { messages: true } },
        participants: {
          where: { leftAt: null },
          include: {
             user: { select: { id: true, displayName: true } }
          }
        }
      }
    });

    return NextResponse.json(rooms);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch chat rooms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const familyId: string = body.familyId;
    const name: string = body.name;
    const isPrivate: boolean = body.isPrivate || false;
    const participantIds: string[] = body.participantIds || [];

    if (!familyId || !name) {
      return NextResponse.json({ error: "familyId and name required" }, { status: 400 });
    }

    // Verify ACTIVE membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare participants: always include creator as ADMIN
    const finalParticipantIds = new Set(participantIds.filter((id) => id !== user.id));
    
    const participantsData = [
      { userId: user.id, role: "ADMIN" as const }, // Author is ADMIN
      ...Array.from(finalParticipantIds).map(uid => ({ userId: uid, role: "MEMBER" as const }))
    ];

    const room = await prisma.chatRoom.create({
      data: {
        familyId,
        name,
        description: body.description ?? null,
        avatarUrl: body.avatarUrl ?? null,
        channelType: isPrivate ? "PRIVATE" : "PUBLIC",
        creatorId: user.id,
        participants: {
          create: participantsData
        }
      },
      include: {
        participants: true
      }
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chatRoomId, name, description, avatarUrl, channelType } = body;

    if (!chatRoomId) {
      return NextResponse.json({ error: "chatRoomId required" }, { status: 400 });
    }

    // Check if user is ADMIN of the room
    const participant = await prisma.chatRoomParticipant.findFirst({
        where: { chatRoomId, userId: user.id, role: "ADMIN" }
    });

    if (!participant) {
        return NextResponse.json({ error: "Forbidden: Only Room Admin can edit" }, { status: 403 });
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        name,
        description,
        avatarUrl,
        channelType // Can switch PUBLIC <-> PRIVATE
      }
    });

    return NextResponse.json(updatedRoom);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update chat room" }, { status: 500 });
  }
}
