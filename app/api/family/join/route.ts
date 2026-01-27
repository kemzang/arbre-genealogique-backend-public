import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const familyId: number = body.familyId;
    if (!familyId)
      return NextResponse.json({ error: "familyId required" }, { status: 400 });

    // prevent duplicate
    const existing = await prisma.member.findFirst({
      where: { userId: user.id, familyId },
    });
    if (existing)
      return NextResponse.json(
        { error: "Already applied or member" },
        { status: 409 },
      );

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        familyId,
        role: "VIEWER",
        status: "PENDING",
        applicationData: {
          gender: body.gender,
          relatedToPersonId: body.relatedToPersonId, // ID of person they claim to be related to
          relationshipType: body.relationshipType, // PARENTAL, UNION, SIBLING
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}
