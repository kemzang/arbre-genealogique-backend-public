import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const superAdmin = await getSuperAdminFromRequest(req);
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30'; // jours
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Statistiques générales
    const [
      totalUsers,
      totalFamilies,
      totalPersons,
      totalMedia,
      totalMessages,
      totalRelationships,
      superAdmins,
      recentUsers,
      recentFamilies,
      activeMembers,
      pendingMembers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.family.count(),
      prisma.person.count(),
      prisma.media.count(),
      prisma.message.count(),
      prisma.relationship.count(),
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.family.count({ where: { createdAt: { gte: startDate } } }),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.count({ where: { status: "PENDING" } })
    ]);

    // Statistiques par rôle
    const roleStats = await prisma.member.groupBy({
      by: ['role'],
      where: { status: "ACTIVE" },
      _count: { role: true }
    });

    // Statistiques par type de média
    const mediaStats = await prisma.media.groupBy({
      by: ['mediaType'],
      _count: { mediaType: true }
    });

    // Statistiques par type de relation
    const relationshipStats = await prisma.relationship.groupBy({
      by: ['type', 'status'],
      _count: { type: true }
    });

    // Top familles par nombre de membres
    const topFamilies = await prisma.family.findMany({
      select: {
        id: true,
        familyName: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            persons: true,
            media: true
          }
        }
      },
      orderBy: {
        members: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Activité récente (derniers 7 jours)
    const recentActivity = {
      newUsers: await prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      newFamilies: await prisma.family.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      newMessages: await prisma.message.count({
        where: { sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      newMedia: await prisma.media.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      })
    };

    // Croissance mensuelle (12 derniers mois)
    const monthlyGrowth = await getMonthlyGrowth();

    return NextResponse.json({
      overview: {
        totalUsers,
        totalFamilies,
        totalPersons,
        totalMedia,
        totalMessages,
        totalRelationships,
        superAdmins,
        activeMembers,
        pendingMembers
      },
      growth: {
        recentUsers,
        recentFamilies,
        monthlyGrowth
      },
      distribution: {
        roleStats: roleStats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.role;
          return acc;
        }, {} as Record<string, number>),
        mediaStats: mediaStats.reduce((acc, stat) => {
          acc[stat.mediaType] = stat._count.mediaType;
          return acc;
        }, {} as Record<string, number>),
        relationshipStats: relationshipStats.reduce((acc, stat) => {
          const key = `${stat.type}_${stat.status}`;
          acc[key] = stat._count.type;
          return acc;
        }, {} as Record<string, number>)
      },
      topFamilies,
      recentActivity
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}

async function getMonthlyGrowth() {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const [users, families] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      }),
      prisma.family.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })
    ]);
    
    months.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM
      users,
      families
    });
  }
  
  return months;
}