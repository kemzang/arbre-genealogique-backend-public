import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const targetMemberId: number = body.targetMemberId;
    const vote: "APPROVE" | "REJECT" = body.vote;
    if (!targetMemberId || !vote)
      return NextResponse.json(
        { error: "targetMemberId and vote required" },
        { status: 400 },
      );

    // user must be ACTIVE in the same family as the target
    const target = await prisma.member.findUnique({
      where: { id: targetMemberId },
    });
    if (!target)
      return NextResponse.json(
        { error: "Target member not found" },
        { status: 404 },
      );

    const userActive = await prisma.member.findFirst({
      where: { userId: user.id, familyId: target.familyId, status: "ACTIVE" },
    });
    if (!userActive)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
      await prisma.membershipValidation.create({
        data: {
          targetMemberId,
          validatorId: user.id,
          voteType: vote,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json(
          { error: "Vous avez déjà voté pour ce membre" },
          { status: 409 },
        );
      }
      throw err;
    }

    // count approvals
    const approvals = await prisma.membershipValidation.count({
      where: { targetMemberId, voteType: "APPROVE" },
    });
    if (approvals >= 3) {
      const activeMember = await prisma.member.update({
        where: { id: targetMemberId },
        data: { status: "ACTIVE" },
      });

      // Automatically add to ALL Public chat rooms of the family
      const publicRooms = await prisma.chatRoom.findMany({
        where: {
          familyId: activeMember.familyId,
          channelType: "PUBLIC"
        }
      });

      if (publicRooms.length > 0) {
        await Promise.all(publicRooms.map(room => 
          prisma.chatRoomParticipant.upsert({
            where: {
              chatRoomId_userId: {
                chatRoomId: room.id,
                userId: activeMember.userId
              }
            },
            update: {},
            create: {
              chatRoomId: room.id,
              userId: activeMember.userId,
              role: "MEMBER"
            }
          })
        ));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
