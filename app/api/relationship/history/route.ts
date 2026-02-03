import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const familyId = url.searchParams.get('familyId');
    const personId = url.searchParams.get('personId');

    if (!familyId && !personId) {
      return NextResponse.json({ error: "familyId or personId required" }, { status: 400 });
    }

    // Check membership
    let targetFamilyId = familyId ? parseInt(familyId) : null;
    
    if (personId) {
      const person = await prisma.person.findUnique({
        where: { id: parseInt(personId) },
        select: { familyId: true }
      });
      if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
      targetFamilyId = person.familyId;
    }

    if (!targetFamilyId) {
      return NextResponse.json({ error: "Unable to determine family" }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: targetFamilyId, status: "ACTIVE" }
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let whereClause: any = {};
    
    if (personId) {
      whereClause = {
        OR: [
          { personAId: parseInt(personId) },
          { personBId: parseInt(personId) }
        ]
      };
    } else if (familyId) {
      whereClause = {
        OR: [
          { personA: { familyId: parseInt(familyId) } },
          { personB: { familyId: parseInt(familyId) } }
        ]
      };
    }

    const relationships = await prisma.relationship.findMany({
      where: whereClause,
      include: {
        personA: { select: { id: true, firstName: true, lastName: true, familyId: true } },
        personB: { select: { id: true, firstName: true, lastName: true, familyId: true } }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { startDate: 'desc' }, // Most recent first
        { id: 'desc' }
      ]
    });

    // Group by status for easier frontend handling
    const activeRelationships = relationships.filter((r: any) => r.status === "ACTIVE");
    const endedRelationships = relationships.filter((r: any) => r.status === "ENDED");
    const deceasedRelationships = relationships.filter((r: any) => r.status === "DECEASED");

    // Statistics
    const stats = {
      total: relationships.length,
      active: activeRelationships.length,
      ended: endedRelationships.length,
      deceased: deceasedRelationships.length,
      byType: {
        unions: relationships.filter((r: any) => r.type === "UNION").length,
        parental: relationships.filter((r: any) => r.type === "PARENTAL").length,
        siblings: relationships.filter((r: any) => r.type === "SIBLING").length
      }
    };

    return NextResponse.json({
      relationships,
      activeRelationships,
      endedRelationships,
      deceasedRelationships,
      stats
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}