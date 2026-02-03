import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Vérifier s'il y a déjà des super-admins
    const existingSuperAdmins = await prisma.user.count({
      where: { isSuperAdmin: true }
    });

    if (existingSuperAdmins > 0) {
      return NextResponse.json({ 
        error: "Super admin already exists. Use regular promotion endpoint." 
      }, { status: 400 });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { confirmEmail } = body;

    // Double vérification avec l'email
    if (confirmEmail !== user.email) {
      return NextResponse.json({ 
        error: "Email confirmation does not match" 
      }, { status: 400 });
    }

    // Promouvoir l'utilisateur actuel en premier super-admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true }
    });

    return NextResponse.json({
      success: true,
      message: "You have been promoted to the first super admin",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        isSuperAdmin: updatedUser.isSuperAdmin
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to bootstrap super admin" }, { status: 500 });
  }
}