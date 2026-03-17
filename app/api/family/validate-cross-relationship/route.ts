import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action } = await req.json(); // action: 'APPROVE' | 'REJECT'

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action required" }, { status: 400 });
    }

    const mergeRequest = await prisma.familyMergeRequest.findUnique({
      where: { id: requestId },
      include: { 
        sourceFamily: true, 
        targetFamily: true,
        sourcePerson: true,
        targetPerson: true
      }
    });

    if (!mergeRequest || mergeRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    // Check if user is ADMIN of the TARGET family
    const membership = await prisma.member.findFirst({
      where: { userId: user.id, familyId: mergeRequest.targetFamilyId, role: "ADMIN", status: "ACTIVE" }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: Only an admin of the target family can validate" }, { status: 403 });
    }

    if (action === "REJECT") {
      const updated = await prisma.familyMergeRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      return NextResponse.json(updated);
    }

    if (action === "APPROVE") {
      // Use a transaction to:
      // 1. Update request status
      // 2. Create family connection
      // 3. Create the actual relationship between the two persons
      const [familyAId, familyBId] = [mergeRequest.sourceFamilyId, mergeRequest.targetFamilyId].sort();
      
      const [updatedRequest, connection, relationship] = await prisma.$transaction([
        prisma.familyMergeRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" }
        }),
        prisma.familyConnection.upsert({
          where: {
            familyAId_familyBId: {
              familyAId,
              familyBId
            }
          },
          update: {},
          create: {
            familyAId,
            familyBId
          }
        }),
        // Create the actual relationship between the two persons
        prisma.relationship.create({
          data: {
            personAId: mergeRequest.sourcePersonId,
            personBId: mergeRequest.targetPersonId,
            type: mergeRequest.relationshipType,
            status: "ACTIVE",
            startDate: new Date(),
            isBiological: true // Default, can be modified later
          }
        })
      ]);

      return NextResponse.json({ 
        updatedRequest, 
        connection, 
        relationship,
        message: `Families connected through ${mergeRequest.relationshipType} relationship between ${mergeRequest.sourcePerson.firstName} and ${mergeRequest.targetPerson.firstName}`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to validate cross relationship" }, { status: 500 });
  }
}
