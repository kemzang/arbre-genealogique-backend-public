import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sourceFamilyId, targetFamilyId } = await req.json();

    if (!sourceFamilyId || !targetFamilyId) {
      return NextResponse.json({ error: "sourceFamilyId and targetFamilyId required" }, { status: 400 });
    }

    // Check if user is ADMIN of the source family
    const membership = await prisma.member.findFirst({
      where: { userId: user.id, familyId: sourceFamilyId, role: "ADMIN", status: "ACTIVE" }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You must be an admin of the source family" }, { status: 403 });
    }

    // Check if a request already exists
    const existing = await prisma.familyMergeRequest.findFirst({
      where: { sourceFamilyId, targetFamilyId, status: "PENDING" }
    });

    if (existing) {
      return NextResponse.json({ error: "A pending request already exists" }, { status: 400 });
    }

    const mergeRequest = await prisma.familyMergeRequest.create({
      data: {
        sourceFamilyId,
        targetFamilyId,
        requesterId: user.id,
        status: "PENDING"
      }
    });

    return NextResponse.json(mergeRequest, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create fusion request" }, { status: 500 });
  }
}
