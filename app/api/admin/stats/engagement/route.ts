import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const superAdmin = await getSuperAdminFromRequest(req);
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Active Users (at least 1 message in last 30 days)
    const activeUserIds = await prisma.message.groupBy({
      by: ['senderId'],
      where: { sentAt: { gte: thirtyDaysAgo } },
      _count: { _all: true }
    });

    const totalUsers = await prisma.user.count();
    const activeCount = activeUserIds.length;

    // List of active families with message counts
    const messagesByFamily = await prisma.chatRoom.findMany({
      select: {
        familyId: true,
        _count: { select: { messages: true } }
      }
    });

    const familyActivity: Record<number, number> = {};
    messagesByFamily.forEach(room => {
      familyActivity[room.familyId] = (familyActivity[room.familyId] || 0) + room._count.messages;
    });

    const activeFamilyIds = Object.keys(familyActivity).map(Number);
    
    const sortedFamilies = await prisma.family.findMany({
      where: { id: { in: activeFamilyIds } },
      select: { 
        id: true, 
        familyName: true,
        _count: {
          select: {
            members: true,
            media: true,
            persons: true
          }
        }
      }
    });

    const formattedTopFamilies = sortedFamilies
      .map(f => ({
        ...f,
        messageCount: familyActivity[f.id] || 0
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    return NextResponse.json({
      engagement: {
        activeUsers30d: activeCount,
        inactiveUsers30d: totalUsers - activeCount,
        activityRatio: totalUsers > 0 ? (activeCount / totalUsers) : 0
      },
      topFamilies: formattedTopFamilies,
      summary: "Engagement is based on user activity in chat rooms and family interactions."
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch engagement stats" }, { status: 500 });
  }
}
