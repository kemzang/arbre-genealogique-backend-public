import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const familyIdParam = url.searchParams.get("familyId");
    let familyId: string | undefined = familyIdParam
      ? familyIdParam
      : undefined;

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!familyId) {
      const membership = await prisma.member.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
      });
      if (!membership)
        return NextResponse.json(
          { error: "No active family" },
          { status: 404 },
        );
      familyId = membership.familyId;
    }

    // Find all connected family IDs
    const connections = await prisma.familyConnection.findMany({
        where: {
            OR: [
                { familyAId: familyId },
                { familyBId: familyId }
            ]
        }
    });

    const connectedFamilyIds = connections.map(c => 
        c.familyAId === familyId ? c.familyBId : c.familyAId
    );
    
    // List of families to include (primary + connected)
    const allFamilyIds = [familyId, ...connectedFamilyIds];

    // Ensure the user is an ACTIVE member of at least one of the involved families
    const authorizedMembership = await prisma.member.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        familyId: { in: allFamilyIds },
      },
    });

    if (!authorizedMembership) {
      return NextResponse.json(
        { error: "Forbidden: not a member of this family network" },
        { status: 403 },
      );
    }

    const persons = await prisma.person.findMany({ 
        where: { familyId: { in: allFamilyIds }, deletedAt: null } 
    });
    
    const personIds = persons.map((p) => p.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { personAId: { in: personIds } },
          { personBId: { in: personIds } },
        ],
        deletedAt: null
      },
    });

    return NextResponse.json({ 
        persons, 
        relationships,
        primaryFamilyId: familyId,
        connectedFamiliesCount: connectedFamilyIds.length 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load tree" }, { status: 500 });
  }
}
