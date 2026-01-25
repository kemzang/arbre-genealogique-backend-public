import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chatRoomId = Number(url.searchParams.get("chatRoomId"));
    if (!chatRoomId)
      return NextResponse.json(
        { error: "chatRoomId required" },
        { status: 400 },
      );

    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verify membership in family of chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });
    if (!chatRoom)
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 },
      );
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: chatRoom.familyId },
    });
    if (!member)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      include: { sender: true },
      orderBy: { sentAt: "asc" },
      take: 500,
    });
    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}
