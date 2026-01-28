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

    // 1. Create "Général" chat room
    const generalRoom = await prisma.chatRoom.create({
      data: {
        familyId: family.id,
        name: "Général",
        description: `Salon de discussion général de la famille ${familyName}`,
        channelType: "PUBLIC",
        creatorId: user.id
      },
    });

    // 2. Create "Family Name" chat room
    const familyRoom = await prisma.chatRoom.create({
      data: {
        familyId: family.id,
        name: `Famille ${familyName}`,
        description: `Salon officiel dédié à la lignée ${familyName}`,
        channelType: "PUBLIC",
        creatorId: user.id
      },
    });

    // Add creator as a participant to both rooms
    await prisma.chatRoomParticipant.createMany({
      data: [
        { chatRoomId: generalRoom.id, userId: user.id, role: "ADMIN" },
        { chatRoomId: familyRoom.id, userId: user.id, role: "ADMIN" }
      ]
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
