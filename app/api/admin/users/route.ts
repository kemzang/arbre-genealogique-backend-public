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
    const status = url.searchParams.get('status'); // 'active', 'suspended', etc.

    const skip = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        displayName: true,
        isSuperAdmin: true,
        createdAt: true,
        profilePictureUrl: true,
        members: {
          select: {
            id: true,
            familyId: true,
            role: true,
            status: true,
            family: {
              select: {
                familyName: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            messages: true,
            uploadedMedia: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}