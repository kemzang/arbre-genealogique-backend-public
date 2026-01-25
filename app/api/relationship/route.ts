import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { personAId, personBId, type, isBiological = true } = body;
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

    // check same family and user is active in that family
    if (personA.familyId !== personB.familyId)
      return NextResponse.json(
        { error: "Persons must belong to same family" },
        { status: 400 },
      );
    const active = await prisma.member.findFirst({
      where: { userId: user.id, familyId: personA.familyId, status: "ACTIVE" },
    });
    if (!active)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rel = await prisma.relationship.create({
      data: { personAId, personBId, type, isBiological },
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
