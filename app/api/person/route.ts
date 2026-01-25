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

    const active = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!active)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data: any = {
      familyId,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      deathDate: body.deathDate ? new Date(body.deathDate) : null,
      gender: body.gender ?? null,
      bio: body.bio ?? null,
      linkedUserId: body.linkedUserId ?? null,
    };

    const person = await prisma.person.create({ data });
    return NextResponse.json(person, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 },
    );
  }
}
