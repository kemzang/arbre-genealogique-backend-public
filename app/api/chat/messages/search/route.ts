import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/chat/messages/search?chatRoomId=:id&q=:query
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const chatRoomId = url.searchParams.get("chatRoomId");
    const q = url.searchParams.get("q")?.trim();

    if (!chatRoomId) return NextResponse.json({ error: "chatRoomId is required" }, { status: 400 });
    if (!q || q.length < 1) return NextResponse.json({ error: "q (search query) is required" }, { status: 400 });

    const room = await prisma.chatRoom.findFirst({
      where: { id: chatRoomId, deletedAt: null },
      select: { familyId: true },
    });
    if (!room) return NextResponse.json({ error: "Chat room not found" }, { status: 404 });

    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: room.familyId, status: "ACTIVE" },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId,
        deletedAt: null,
        content: { contains: q, mode: "insensitive" },
      },
      include: {
        sender: { select: { id: true, displayName: true, profilePictureUrl: true } },
        attachments: true,
      },
      orderBy: { sentAt: "asc" },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 });
  }
}
