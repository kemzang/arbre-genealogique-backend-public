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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            family: {
              select: {
                id: true,
                familyName: true,
                createdAt: true
              }
            }
          }
        },
        messages: {
          take: 10,
          orderBy: { sentAt: 'desc' },
          include: {
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
          }
        },
        uploadedMedia: {
          take: 10,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            urlPath: true,
            mediaType: true,
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
            uploadedMedia: true,
            validationsGiven: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { action, ...updateData } = body;

    if (action === "promote") {
      // Promouvoir en super-admin
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isSuperAdmin: true }
      });
      
      return NextResponse.json({
        ...updatedUser,
        message: "User promoted to super admin"
      });
    }

    if (action === "demote") {
      // Rétrograder (retirer super-admin)
      if (id === superAdmin.id) {
        return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isSuperAdmin: false }
      });
      
      return NextResponse.json({
        ...updatedUser,
        message: "User demoted from super admin"
      });
    }

    // Autres mises à jour (nom, email, etc.)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
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

    if (id === superAdmin.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    // Vérifier si l'utilisateur est le seul admin de certaines familles
    const adminMemberships = await prisma.member.findMany({
      where: { userId: id, role: "ADMIN", status: "ACTIVE" },
      include: {
        family: {
          include: {
            members: {
              where: { role: "ADMIN", status: "ACTIVE" }
            }
          }
        }
      }
    });

    const familiesWithOnlyThisAdmin = adminMemberships.filter(
      membership => membership.family.members.length === 1
    );

    if (familiesWithOnlyThisAdmin.length > 0) {
      return NextResponse.json({
        error: "Cannot delete user: they are the only admin of some families",
        families: familiesWithOnlyThisAdmin.map(m => m.family.familyName)
      }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}