import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET event details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const event = await prisma.familyEvent.findUnique({
      where: { id },
      include: {
        media: {
          include: {
            uploader: {
              select: { displayName: true }
            }
          }
        }
      }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Check if user belongs to the family
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: event.familyId, status: "ACTIVE" }
    });

    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(event);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// UPDATE event
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { title, eventDate, location } = body;

    const event = await prisma.familyEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Only ADMIN or EDITOR can update
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: event.familyId, 
        status: "ACTIVE",
        role: { in: ["ADMIN", "EDITOR"] }
      }
    });

    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.familyEvent.update({
      where: { id },
      data: {
        title: title ?? undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        location: location ?? undefined
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE event
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const event = await prisma.familyEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Only ADMIN or EDITOR can delete
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: event.familyId, 
        status: "ACTIVE",
        role: { in: ["ADMIN", "EDITOR"] }
      }
    });

    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.familyEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
