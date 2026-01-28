import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chatRoomId, userIdToAdd } = body;

    if (!chatRoomId || !userIdToAdd) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify requester IS admin of room
    const requester = await prisma.chatRoomParticipant.findFirst({
        where: { chatRoomId, userId: user.id, role: "ADMIN" }
    });
    if (!requester) {
        return NextResponse.json({ error: "Forbidden: Only Admin can add members" }, { status: 403 });
    }

    // Check if user to add is valid family active member
    // First get chatroom family
    const room = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const targetUserInFamily = await prisma.member.findFirst({
        where: { userId: userIdToAdd, familyId: room.familyId, status: "ACTIVE" }
    });
    if (!targetUserInFamily) {
        return NextResponse.json({ error: "User is not active member of this family" }, { status: 400 });
    }
    
    // Add participant
    // Use upsert to avoid error if already there
    const participant = await prisma.chatRoomParticipant.upsert({
        where: {
            chatRoomId_userId: { chatRoomId, userId: userIdToAdd }
        },
        update: {}, // Do nothing if exists
        create: {
            chatRoomId,
            userId: userIdToAdd,
            role: "MEMBER"
        }
    });

    return NextResponse.json(participant);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const body = await req.json();
      const { chatRoomId, userIdToRemove } = body;
  
      if (!chatRoomId || !userIdToRemove) {
          return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
  
      // Verify requester IS admin of room
      const requester = await prisma.chatRoomParticipant.findFirst({
          where: { chatRoomId, userId: user.id, role: "ADMIN" }
      });
      if (!requester) {
          return NextResponse.json({ error: "Forbidden: Only Admin can remove members" }, { status: 403 });
      }
      
      // Prevent removing oneself if they are the last admin? (Optional complexity, skipping for now)

      await prisma.chatRoomParticipant.deleteMany({
          where: {
              chatRoomId,
              userId: userIdToRemove
          }
      });
  
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 });
    }
  }
