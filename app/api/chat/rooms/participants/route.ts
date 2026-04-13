import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const chatRoomIdParam = url.searchParams.get("chatRoomId");

    if (!chatRoomIdParam) {
      return NextResponse.json({ error: "chatRoomId required" }, { status: 400 });
    }

    const chatRoomId = chatRoomIdParam;

    // Verify chat room exists
    const room = await prisma.chatRoom.findUnique({ 
      where: { id: chatRoomId },
      select: { familyId: true, channelType: true }
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
      const isParticipant = await prisma.chatRoomParticipant.findFirst({
        where: { 
          chatRoomId, 
          userId: user.id,
          leftAt: null
        }
      });

      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden: You are not a participant of this private room" }, { status: 403 });
      }
    }

    // Get all active participants
    const participants = await prisma.chatRoomParticipant.findMany({
      where: { 
        chatRoomId,
        leftAt: null
      },
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
    });

    return NextResponse.json(participants);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chatRoomId, userIdToAdd, userEmail } = body;

    if (!chatRoomId || (!userIdToAdd && !userEmail)) {
        return NextResponse.json({ error: "chatRoomId and either userIdToAdd or userEmail are required" }, { status: 400 });
    }

    // Verify requester IS admin of room
    const requester = await prisma.chatRoomParticipant.findFirst({
        where: { chatRoomId, userId: user.id, role: "ADMIN" }
    });
    if (!requester) {
        return NextResponse.json({ error: "Forbidden: Only Admin can add members" }, { status: 403 });
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Resolve user by email if userIdToAdd not provided
    let resolvedUserId: string = userIdToAdd;
    if (!resolvedUserId && userEmail) {
        const foundUser = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
        if (!foundUser) {
            return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
        }
        resolvedUserId = foundUser.id;
    }

    const targetUserInFamily = await prisma.member.findFirst({
        where: { userId: resolvedUserId, familyId: room.familyId, status: "ACTIVE" }
    });
    if (!targetUserInFamily) {
        return NextResponse.json({ error: "User is not active member of this family" }, { status: 400 });
    }
    
    // Add participant
    // Use upsert to avoid error if already there
    const participant = await prisma.chatRoomParticipant.upsert({
        where: {
            chatRoomId_userId: { chatRoomId, userId: resolvedUserId }
        },
        update: { leftAt: null },
        create: {
            chatRoomId,
            userId: resolvedUserId,
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

      // Soft delete using leftAt
      await prisma.chatRoomParticipant.updateMany({
          where: {
              chatRoomId,
              userId: userIdToRemove
          },
          data: {
              leftAt: new Date()
          }
      });
  
      return NextResponse.json({ success: true, message: "Participant removed successfully" });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 });
    }
  }
