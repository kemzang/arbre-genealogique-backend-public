import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = idStr;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { endReason, endDate, notes } = body;

    if (!endReason) {
      return NextResponse.json({ error: "endReason is required" }, { status: 400 });
    }

    // Find relationship to check permissions
    const relationship = await prisma.relationship.findUnique({
      where: { id },
      include: { 
        personA: { include: { family: true } },
        personB: { include: { family: true } }
      }
    });

    if (!relationship) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    // Check if user is active member of at least one involved family
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: { in: [relationship.personA.familyId, relationship.personB.familyId] },
        status: "ACTIVE" 
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update relationship status
    const updated = await prisma.relationship.update({
      where: { id },
      data: {
        status: endReason.toLowerCase().includes('décès') || endReason.toLowerCase().includes('death') 
          ? "DECEASED" 
          : "ENDED",
        endDate: endDate ? new Date(endDate) : new Date(),
        endReason,
        notes
      },
      include: {
        personA: { select: { firstName: true, lastName: true } },
        personB: { select: { firstName: true, lastName: true } }
      }
    });

    // If this was a UNION relationship that connected two families, 
    // check if there are other active relationships between the families
    if (relationship.type === "UNION" && 
        relationship.personA.familyId !== relationship.personB.familyId) {
      
      const otherActiveRelationships = await prisma.relationship.findFirst({
        where: {
          status: "ACTIVE",
          OR: [
            {
              personA: { familyId: relationship.personA.familyId },
              personB: { familyId: relationship.personB.familyId }
            },
            {
              personA: { familyId: relationship.personB.familyId },
              personB: { familyId: relationship.personA.familyId }
            }
          ],
          id: { not: id } // Exclude the current relationship
        }
      });

      // If no other active relationships exist, consider disconnecting families
      if (!otherActiveRelationships) {
        // Note: We don't automatically disconnect families as there might be children
        // or other historical reasons to keep the connection
        return NextResponse.json({
          ...updated,
          warning: "This was the last active relationship between the families. Consider reviewing family connection."
        });
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to end relationship" }, { status: 500 });
  }
}