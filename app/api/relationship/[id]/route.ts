import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);
    const body = await req.json();
    const { type, isBiological } = body;

    // Find relationship to check permissions
    const relationship = await prisma.relationship.findUnique({
      where: { id },
      include: { personA: true }
    });

    if (!relationship) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    // Check if user is active member of the family
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: relationship.personA.familyId, 
        status: "ACTIVE" 
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.relationship.update({
      where: { id },
      data: {
        type: type ?? undefined,
        isBiological: isBiological !== undefined ? isBiological : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update relationship" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);

    // Find relationship to check permissions
    const relationship = await prisma.relationship.findUnique({
      where: { id },
      include: { personA: true }
    });

    if (!relationship) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    // Check if user is active member of the family
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: relationship.personA.familyId, 
        status: "ACTIVE" 
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.relationship.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete relationship" }, { status: 500 });
  }
}
