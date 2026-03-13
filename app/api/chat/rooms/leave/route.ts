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
      return NextResponse.json({ error: "chatRoomId required" }, { status: 400 });
    }

    // Verify room exists
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        participants: {
          where: { role: "ADMIN" }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // Check if user is a participant
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: { chatRoomId, userId: user.id }
    });

    if (!participant) {
      return NextResponse.json({ 
        error: "You are not a participant of this room" 
      }, { status: 400 });
    }

    // Prevent last admin from leaving
    if (participant.role === "ADMIN" && room.participants.length === 1) {
      return NextResponse.json({ 
        error: "Cannot leave: You are the last admin. Please assign another admin first or delete the room." 
      }, { status: 400 });
    }

    // Remove participant
    await prisma.chatRoomParticipant.delete({
      where: {
        chatRoomId_userId: {
          chatRoomId,
          userId: user.id
        }
      }
    });

    return NextResponse.json({ success: true, message: "You have left the chat room" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to leave chat room" }, { status: 500 });
  }
}
