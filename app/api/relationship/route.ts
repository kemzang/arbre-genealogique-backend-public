import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
      personAId, 
      personBId, 
      type, 
      isBiological = true,
      startDate,
      notes
    } = body;
    
    if (!personAId || !personBId || !type)
      return NextResponse.json(
        { error: "personAId, personBId and type required" },
        { status: 400 },
      );

    const personA = await prisma.person.findUnique({
      where: { id: personAId },
    });
    const personB = await prisma.person.findUnique({
      where: { id: personBId },
    });
    if (!personA || !personB)
      return NextResponse.json({ error: "Person not found" }, { status: 404 });

    // logic for cross-family relationships
    if (personA.familyId !== personB.familyId) {
        // Check if families are connected
        const connection = await prisma.familyConnection.findFirst({
            where: {
                OR: [
                    { familyAId: personA.familyId, familyBId: personB.familyId },
                    { familyAId: personB.familyId, familyBId: personA.familyId }
                ]
            }
        });

        if (!connection) {
            return NextResponse.json(
                { error: "Families are not connected. Send a fusion request first." },
                { status: 400 },
            );
        }
    }

    // User must be active in at least one of the involved families
    const active = await prisma.member.findFirst({
      where: { 
          userId: user.id, 
          familyId: { in: [personA.familyId, personB.familyId] }, 
          status: "ACTIVE" 
      },
    });
    
    if (!active)
      return NextResponse.json({ error: "Forbidden: You are not an active member of involved families" }, { status: 403 });

    const rel = await prisma.relationship.create({
      data: { 
        personAId, 
        personBId, 
        type, 
        isBiological,
        status: "ACTIVE",
        startDate: startDate ? new Date(startDate) : new Date(),
        notes
      },
    });
    return NextResponse.json(rel, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create relationship" },
      { status: 500 },
    );
  }
}
