import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  // Create a Family and make the current user an ADMIN ACTIVE member
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const familyName: string = body.familyName;
    if (!familyName)
      return NextResponse.json(
        { error: "familyName required" },
        { status: 400 },
      );

    const family = await prisma.family.create({ data: { familyName } });

    // Create default chat room
    await prisma.chatRoom.create({
      data: {
        familyId: family.id,
        name: "Général",
      },
    });

    await prisma.member.create({
      data: {
        userId: user.id,
        familyId: family.id,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json(family, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 },
    );
  }
}
