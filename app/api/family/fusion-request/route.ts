import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { 
      sourceFamilyId, 
      targetFamilyId, 
      sourcePersonId, 
      targetPersonId, 
      relationshipType, 
      justification 
    } = await req.json();

    if (!sourceFamilyId || !targetFamilyId || !sourcePersonId || !targetPersonId || !relationshipType) {
      return NextResponse.json({ 
        error: "sourceFamilyId, targetFamilyId, sourcePersonId, targetPersonId and relationshipType required" 
      }, { status: 400 });
    }

    // Check if user is ADMIN of the source family
    const membership = await prisma.member.findFirst({
      where: { userId: user.id, familyId: sourceFamilyId, role: "ADMIN", status: "ACTIVE" }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You must be an admin of the source family" }, { status: 403 });
    }

    // Verify that sourcePersonId belongs to sourceFamilyId
    const sourcePerson = await prisma.person.findFirst({
      where: { id: sourcePersonId, familyId: sourceFamilyId }
    });

    if (!sourcePerson) {
      return NextResponse.json({ error: "Source person must belong to source family" }, { status: 400 });
    }

    // Verify that targetPersonId belongs to targetFamilyId
    const targetPerson = await prisma.person.findFirst({
      where: { id: targetPersonId, familyId: targetFamilyId }
    });

    if (!targetPerson) {
      return NextResponse.json({ error: "Target person must belong to target family" }, { status: 400 });
    }

    // Check if a relationship already exists between these two persons
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          { personAId: sourcePersonId, personBId: targetPersonId },
          { personAId: targetPersonId, personBId: sourcePersonId }
        ]
      }
    });

    if (existingRelationship) {
      return NextResponse.json({ error: "A relationship already exists between these persons" }, { status: 400 });
    }

    // Check if a request already exists for these specific persons
    const existing = await prisma.familyMergeRequest.findFirst({
      where: { 
        sourceFamilyId, 
        targetFamilyId, 
        sourcePersonId, 
        targetPersonId, 
        status: "PENDING" 
      }
    });

    if (existing) {
      return NextResponse.json({ error: "A pending request already exists for these persons" }, { status: 400 });
    }

    const mergeRequest = await prisma.familyMergeRequest.create({
      data: {
        sourceFamilyId,
        targetFamilyId,
        requesterId: user.id,
        sourcePersonId,
        targetPersonId,
        relationshipType,
        justification,
        status: "PENDING"
      },
      include: {
        sourceFamily: { select: { familyName: true } },
        targetFamily: { select: { familyName: true } },
        sourcePerson: { select: { firstName: true, lastName: true } },
        targetPerson: { select: { firstName: true, lastName: true } },
        requester: { select: { displayName: true } }
      }
    });

    return NextResponse.json(mergeRequest, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create fusion request" }, { status: 500 });
  }
}
