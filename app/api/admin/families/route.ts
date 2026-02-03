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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause.familyName = { contains: search };
    }

    const families = await prisma.family.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            persons: true,
            media: true,
            chatRooms: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalFamilies = await prisma.family.count({ where: whereClause });

    // Enrichir avec des statistiques
    const enrichedFamilies = families.map(family => ({
      ...family,
      stats: {
        totalMembers: family._count.members,
        activeMembers: family.members.filter(m => m.status === "ACTIVE").length,
        pendingMembers: family.members.filter(m => m.status === "PENDING").length,
        admins: family.members.filter(m => m.role === "ADMIN" && m.status === "ACTIVE").length,
        totalPersons: family._count.persons,
        totalMedia: family._count.media,
        totalChatRooms: family._count.chatRooms
      }
    }));

    return NextResponse.json({
      families: enrichedFamilies,
      pagination: {
        page,
        limit,
        total: totalFamilies,
        pages: Math.ceil(totalFamilies / limit)
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 });
  }
}