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
    const { 
      familyIds = [], // Array of family IDs where this event is shared
      title, 
      eventDate, 
      location, 
      visibility = "PUBLIC", 
      guestPersonIds = [],
      targetPersonId // For BRANCH visibility
    } = body;

    // Use the first familyId as the primary one for validation if familyIds is provided
    const primaryFamilyId = familyIds.length > 0 ? familyIds[0] : null;

    if (!primaryFamilyId || !title) {
      return NextResponse.json(
        { error: "At least one familyId and title are required" },
        { status: 400 }
      );
    }

    // Check if user is an ACTIVE member of ALL target families
    const memberships = await prisma.member.findMany({
      where: {
        userId: user.id,
        familyId: { in: familyIds.map((id: any) => parseInt(id)) },
        status: "ACTIVE",
      },
    });

    if (memberships.length < familyIds.length) {
      return NextResponse.json({ error: "Forbidden: You are not an active member of all specified families" }, { status: 403 });
    }

    // Create the event
    const event = await prisma.familyEvent.create({
      data: {
        creatorId: user.id,
        title,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
        visibility,
        targetPersonId: visibility === "BRANCH" ? parseInt(targetPersonId) : null,
        // Shared with these families
        sharedFamilies: {
            create: familyIds.map((fid: any) => ({
                familyId: parseInt(fid)
            }))
        },
        // If restricted, add guests
        guests: visibility === "RESTRICTED" && guestPersonIds.length > 0
          ? {
              create: guestPersonIds.map((pid: any) => ({
                personId: parseInt(pid),
              })),
            }
          : undefined,
      },
      include: {
        guests: true,
        sharedFamilies: true
      }
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
