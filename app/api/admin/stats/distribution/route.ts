import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const superAdmin = await getSuperAdminFromRequest(req);
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    // 1. Roles
    const totalUsers = await prisma.user.count();
    const superAdmins = await prisma.user.count({ where: { isSuperAdmin: true } });
    
    // Member roles count (ADMIN, EDITOR, VIEWER)
    const roleDistribution = await prisma.member.groupBy({
      by: ['role'],
      _count: { _all: true }
    });

    // 2. Family Sizes
    const families = await prisma.family.findMany({
      include: { _count: { select: { members: true } } }
    });
    
    const sizeGroups = {
      "1-5": 0,
      "6-10": 0,
      "11-20": 0,
      "20+": 0
    };

    families.forEach(f => {
      const count = f._count.members;
      if (count <= 5) sizeGroups["1-5"]++;
      else if (count <= 10) sizeGroups["6-10"]++;
      else if (count <= 20) sizeGroups["11-20"]++;
      else sizeGroups["20+"]++;
    });

    // 3. Media Types
    const mediaStats = await prisma.media.groupBy({
      by: ['mediaType'],
      _count: { _all: true }
    });

    // 4. Activity by Hour (based on messages)
    const recentMessages = await prisma.message.findMany({
      take: 2000,
      select: { sentAt: true },
      orderBy: { sentAt: 'desc' }
    });

    const hourlyActivity = new Array(24).fill(0);
    recentMessages.forEach(m => {
      const hour = new Date(m.sentAt).getHours();
      hourlyActivity[hour]++;
    });

    return NextResponse.json({
      roles: {
        platform: {
          superAdmins,
          regularUsers: totalUsers - superAdmins
        },
        familyMembers: roleDistribution.map(r => ({ role: r.role, count: r._count._all }))
      },
      familySizes: sizeGroups,
      mediaTypes: mediaStats.map(m => ({ type: m.mediaType, count: m._count._all })),
      hourlyActivity: hourlyActivity.map((count, hour) => ({ hour, count }))
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch distribution stats" }, { status: 500 });
  }
}
