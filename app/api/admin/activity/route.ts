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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type'); // 'users', 'families', 'messages', 'media'

    // Activité récente des utilisateurs
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        isSuperAdmin: true,
        _count: {
          select: {
            members: true,
            messages: true,
            uploadedMedia: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: type === 'users' ? limit : 10
    });

    // Activité récente des familles
    const recentFamilies = await prisma.family.findMany({
      select: {
        id: true,
        familyName: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            persons: true
          }
        },
        members: {
          where: { role: "ADMIN", status: "ACTIVE" },
          select: {
            user: {
              select: {
                displayName: true,
                email: true
              }
            }
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: type === 'families' ? limit : 10
    });

    // Messages récents
    const recentMessages = await prisma.message.findMany({
      select: {
        id: true,
        content: true,
        sentAt: true,
        sender: {
          select: {
            displayName: true,
            email: true
          }
        },
        chatRoom: {
          select: {
            name: true,
            family: {
              select: {
                familyName: true
              }
            }
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: type === 'messages' ? limit : 10
    });

    // Médias récents
    const recentMedia = await prisma.media.findMany({
      select: {
        id: true,
        urlPath: true,
        mediaType: true,
        uploader: {
          select: {
            displayName: true,
            email: true
          }
        },
        family: {
          select: {
            familyName: true
          }
        },
        person: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: type === 'media' ? limit : 10
    });

    // Demandes de fusion récentes
    const recentFusionRequests = await prisma.familyMergeRequest.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        relationshipType: true,
        justification: true,
        sourceFamily: {
          select: {
            familyName: true
          }
        },
        targetFamily: {
          select: {
            familyName: true
          }
        },
        requester: {
          select: {
            displayName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Membres en attente
    const pendingMembers = await prisma.member.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        joinedAt: true,
        applicationData: true,
        user: {
          select: {
            displayName: true,
            email: true
          }
        },
        family: {
          select: {
            familyName: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      recentUsers,
      recentFamilies,
      recentMessages,
      recentMedia,
      recentFusionRequests,
      pendingMembers,
      summary: {
        totalRecentUsers: recentUsers.length,
        totalRecentFamilies: recentFamilies.length,
        totalPendingMembers: pendingMembers.length,
        totalFusionRequests: recentFusionRequests.length
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}