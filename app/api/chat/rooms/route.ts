import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const familyIdParam = url.searchParams.get("familyId");
    
    if (!familyIdParam) {
      return NextResponse.json({ error: "familyId required" }, { status: 400 });
    }
    const familyId = Number(familyIdParam);

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: familyId, status: "ACTIVE" },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: { familyId },
      include: {
        // Optional: include last message or unread count if needed
        _count: { select: { messages: true } }
      }
    });

    return NextResponse.json(rooms);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch chat rooms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const familyId: number = body.familyId;
    const name: string = body.name;

    if (!familyId || !name) {
      return NextResponse.json({ error: "familyId and name required" }, { status: 400 });
    }

    // Verify ACTIVE membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.chatRoom.create({
      data: {
        familyId,
        name,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 });
  }
}
