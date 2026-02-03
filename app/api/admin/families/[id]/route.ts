import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const superAdmin = await getSuperAdminFromRequest(req);
    
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                profilePictureUrl: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        persons: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            deathDate: true,
            gender: true
          },
          orderBy: { id: 'asc' }
        },
        chatRooms: {
          select: {
            id: true,
            name: true,
            channelType: true,
            _count: {
              select: {
                messages: true,
                participants: true
              }
            }
          }
        },
        media: {
          take: 20,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            urlPath: true,
            mediaType: true,
            uploader: {
              select: {
                displayName: true
              }
            }
          }
        },
        connectionsA: {
          include: {
            familyB: {
              select: {
                id: true,
                familyName: true
              }
            }
          }
        },
        connectionsB: {
          include: {
            familyA: {
              select: {
                id: true,
                familyName: true
              }
            }
          }
        }
      }
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Calculer des statistiques avancées
    const stats = {
      totalMembers: family.members.length,
      activeMembers: family.members.filter(m => m.status === "ACTIVE").length,
      pendingMembers: family.members.filter(m => m.status === "PENDING").length,
      admins: family.members.filter(m => m.role === "ADMIN" && m.status === "ACTIVE").length,
      editors: family.members.filter(m => m.role === "EDITOR" && m.status === "ACTIVE").length,
      viewers: family.members.filter(m => m.role === "VIEWER" && m.status === "ACTIVE").length,
      totalPersons: family.persons.length,
      livingPersons: family.persons.filter(p => !p.deathDate).length,
      deceasedPersons: family.persons.filter(p => p.deathDate).length,
      totalMedia: family.media.length,
      totalChatRooms: family.chatRooms.length,
      connectedFamilies: [...family.connectionsA, ...family.connectionsB].length
    };

    return NextResponse.json({
      ...family,
      stats
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch family details" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const superAdmin = await getSuperAdminFromRequest(req);
    
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    // Vérifier si la famille a des connexions avec d'autres familles
    const connections = await prisma.familyConnection.findMany({
      where: {
        OR: [
          { familyAId: id },
          { familyBId: id }
        ]
      },
      include: {
        familyA: { select: { familyName: true } },
        familyB: { select: { familyName: true } }
      }
    });

    if (connections.length > 0) {
      return NextResponse.json({
        error: "Cannot delete family: it has connections with other families",
        connections: connections.map(c => ({
          connectedTo: c.familyAId === id ? c.familyB.familyName : c.familyA.familyName
        }))
      }, { status: 400 });
    }

    // Supprimer la famille (cascade supprimera automatiquement les relations)
    await prisma.family.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Family deleted successfully" 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete family" }, { status: 500 });
  }
}