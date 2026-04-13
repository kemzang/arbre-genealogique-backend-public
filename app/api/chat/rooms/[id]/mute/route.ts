import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// PUT /api/chat/rooms/:id/mute
// Body: { "muted": true | false }
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatRoomId } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (typeof body.muted !== "boolean") {
      return NextResponse.json({ error: "Field 'muted' (boolean) is required" }, { status: 400 });
    }

    const participant = await prisma.chatRoomParticipant.findFirst({
      where: { chatRoomId, userId: user.id, leftAt: null },
    });
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant of this room" }, { status: 403 });
    }

    const updated = await prisma.chatRoomParticipant.update({
      where: { id: participant.id },
      data: { muted: body.muted },
      select: { chatRoomId: true, userId: true, muted: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update mute preference" }, { status: 500 });
  }
}
