import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active family memberships
    const memberships = await prisma.member.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { familyId: true }
    });

    const familyIds = memberships.map(m => m.familyId);

    // Count family members across all user's families
    const familyMembers = await prisma.member.count({
      where: {
        familyId: { in: familyIds },
        status: "ACTIVE"
      }
    });

    // Count events created by user
    const eventsCreated = await prisma.familyEvent.count({
      where: { creatorId: user.id }
    });

    // Count messages sent by user
    const messagesSent = await prisma.message.count({
      where: { senderId: user.id }
    });

    // Count chat rooms joined
    const chatRoomsJoined = await prisma.chatRoomParticipant.count({
      where: { userId: user.id }
    });

    return NextResponse.json({
      familyMembers,
      eventsCreated,
      messagesSent,
      chatRoomsJoined
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch profile stats" },
      { status: 500 }
    );
  }
}
