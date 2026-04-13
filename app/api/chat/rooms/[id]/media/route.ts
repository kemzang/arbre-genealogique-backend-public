import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/chat/rooms/:id/media
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatRoomId } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const room = await prisma.chatRoom.findFirst({
      where: { id: chatRoomId, deletedAt: null },
      select: { familyId: true, channelType: true },
    });
    if (!room) return NextResponse.json({ error: "Chat room not found" }, { status: 404 });

    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: room.familyId, status: "ACTIVE" },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (room.channelType === "PRIVATE") {
      const participant = await prisma.chatRoomParticipant.findFirst({
        where: { chatRoomId, userId: user.id, leftAt: null },
      });
      if (!participant) {
        return NextResponse.json({ error: "Forbidden: not a participant" }, { status: 403 });
      }
    }

    const media = await prisma.media.findMany({
      where: {
        message: { chatRoomId },
      },
      include: {
        uploader: { select: { displayName: true } },
        message: { select: { sentAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = media.map((m) => ({
      id: m.id,
      url: m.urlPath,
      type: m.mediaType,
      fileName: m.urlPath.split("/").pop() ?? m.id,
      sentAt: m.message?.sentAt ?? m.createdAt,
      senderName: m.uploader.displayName ?? "Unknown",
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}
