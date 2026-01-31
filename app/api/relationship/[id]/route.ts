import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rel = await prisma.relationship.findUnique({
      where: { id },
      include: {
        personA: true,
        personB: true,
      }
    });

    if (!rel) return NextResponse.json({ error: "Relationship not found" }, { status: 404 });

    // Check membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: rel.personA.familyId, status: "ACTIVE" }
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let children: any[] = [];
    if (rel.type === "UNION") {
      // Find children of this union
      // A child of this union is someone who has a PARENTAL relationship with personA AND personB
      const childrenA = await prisma.relationship.findMany({
        where: { type: "PARENTAL", personAId: rel.personAId },
        select: { personBId: true }
      });
      const childrenB = await prisma.relationship.findMany({
        where: { type: "PARENTAL", personAId: rel.personBId },
        select: { personBId: true }
      });

      const childIdsA = childrenA.map(c => c.personBId);
      const childIdsB = childrenB.map(c => c.personBId);
      const commonChildIds = childIdsA.filter(id => childIdsB.includes(id));

      children = await prisma.person.findMany({
        where: { id: { in: commonChildIds } }
      });
    }

    return NextResponse.json({
      relationship: rel,
      children
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
