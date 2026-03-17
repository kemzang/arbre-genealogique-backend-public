import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const familyId: string = body.familyId;
    if (!familyId)
      return NextResponse.json({ error: "familyId required" }, { status: 400 });

    const active = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!active)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Enforce write permissions: only ADMIN or EDITOR can create persons
    if (active.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to create person" },
        { status: 403 },
      );
    }

    const data: any = {
      familyId,
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      deathDate: body.deathDate ? new Date(body.deathDate) : null,
      gender: body.gender ?? null,
      bio: body.bio ?? null,
      profilePictureUrl: body.profilePictureUrl ?? null,
      linkedUserId: body.linkedUserId ?? null,
    };

    const person = await prisma.person.create({ data });

    // If a user is linked to this person, optionally adjust their membership in the family.
    // Only ADMIN/EDITOR can act as "gatekeepers" to make them ACTIVE immediately.
    if (body.linkedUserId) {
      const linkedUserId = body.linkedUserId;
      
      const existingMember = await prisma.member.findFirst({
        where: { userId: linkedUserId, familyId }
      });

      let targetMember = existingMember;

      if (!targetMember) {
        targetMember = await prisma.member.create({
          data: {
            userId: linkedUserId,
            familyId,
            role: "VIEWER",
            status:
              active.role === "ADMIN" || active.role === "EDITOR"
                ? "ACTIVE"
                : "PENDING",
          }
        });
      } else if (
        targetMember.status !== "ACTIVE" &&
        (active.role === "ADMIN" || active.role === "EDITOR")
      ) {
        targetMember = await prisma.member.update({
          where: { id: targetMember.id },
          data: { status: "ACTIVE" },
        });
      }

      // Update person photo if they don't have one but the linked user does
      const userToCopy = await prisma.user.findUnique({ where: { id: linkedUserId } });
      if (userToCopy?.profilePictureUrl && !person.profilePictureUrl) {
          await prisma.person.update({
              where: { id: person.id },
              data: { profilePictureUrl: userToCopy.profilePictureUrl }
          });
      }

      // Add to ALL Public chat rooms only if the linked user is ACTIVE in the family
      if (targetMember.status === "ACTIVE") {
        const publicRooms = await prisma.chatRoom.findMany({
          where: { familyId, channelType: "PUBLIC" },
        });

        if (publicRooms.length > 0) {
          await Promise.all(
            publicRooms.map((room) =>
              prisma.chatRoomParticipant.upsert({
                where: {
                  chatRoomId_userId: {
                    chatRoomId: room.id,
                    userId: linkedUserId,
                  },
                },
                update: {},
                create: {
                  chatRoomId: room.id,
                  userId: linkedUserId,
                  role: "MEMBER",
                },
              }),
            ),
          );
        }
      }
    }

    return NextResponse.json(person, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 },
    );
  }
}
