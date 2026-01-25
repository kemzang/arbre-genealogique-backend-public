import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const chatRoomId: number = body.chatRoomId;
    const content: string = body.content;
    if (!chatRoomId || !content)
      return NextResponse.json(
        { error: "chatRoomId and content required" },
        { status: 400 },
      );

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });
    if (!chatRoom)
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 },
      );
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: chatRoom.familyId, status: "ACTIVE" },
    });
    if (!member)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await prisma.message.create({
      data: { chatRoomId, senderId: user.id, content },
    });
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
