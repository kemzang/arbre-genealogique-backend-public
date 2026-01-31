import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { familyId, title, eventDate, location } = body;

    if (!familyId || !title) {
      return NextResponse.json(
        { error: "familyId and title are required" },
        { status: 400 }
      );
    }

    // Check if user is an ACTIVE member of the family
    const membership = await prisma.member.findFirst({
      where: {
        userId: user.id,
        familyId: parseInt(familyId),
        status: "ACTIVE",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.familyEvent.create({
      data: {
        familyId: parseInt(familyId),
        title,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
