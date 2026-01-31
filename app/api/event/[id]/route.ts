import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

/**
 * Helper to check if two persons are in the same kinship branch.
 */
async function belongsToBranch(personId: number, targetPersonId: number): Promise<boolean> {
    if (personId === targetPersonId) return true;
    let visited = new Set<number>();
    let queue = [personId];
    visited.add(personId);
    let depth = 0;
    const MAX_DEPTH = 6; 

    while (queue.length > 0 && depth < MAX_DEPTH) {
        let size = queue.length;
        for (let i = 0; i < size; i++) {
            let currentId = queue.shift()!;
            if (currentId === targetPersonId) return true;
            const relations = await prisma.relationship.findMany({
                where: { OR: [ { personAId: currentId }, { personBId: currentId } ] }
            });
            for (const rel of relations) {
                const neighborId = rel.personAId === currentId ? rel.personBId : rel.personAId;
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }
        depth++;
    }
    return false;
}

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
          include: { uploader: { select: { displayName: true, profilePictureUrl: true } } }
        },
        guests: true,
        creator: { select: { displayName: true, profilePictureUrl: true } },
        sharedFamilies: true
      }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Check visibility
    if (event.creatorId !== user.id) {
        if (event.visibility === "PRIVATE") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        
        if (event.visibility === "RESTRICTED") {
            const linkedPerson = await prisma.person.findFirst({
                where: { linkedUserId: user.id } // Simplification: search in any family
            });
            const isGuest = event.guests.some(g => g.personId === linkedPerson?.id);
            if (!isGuest) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (event.visibility === "BRANCH" && event.targetPersonId) {
            const linkedPerson = await prisma.person.findFirst({
                where: { linkedUserId: user.id }
            });
            if (!linkedPerson || !(await belongsToBranch(linkedPerson.id, event.targetPersonId))) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
    }

    // Still check if user belongs to at least one of the shared families
    const userFamilyIds = (await prisma.member.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        select: { familyId: true }
    })).map(m => m.familyId);

    const isSharedWithUser = event.sharedFamilies.some(sf => userFamilyIds.includes(sf.familyId));
    if (!isSharedWithUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const { title, eventDate, location, visibility, guestPersonIds, familyIds, targetPersonId } = body;

    const event = await prisma.familyEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Only CREATOR can update
    if (event.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.familyEvent.update({
      where: { id },
      data: {
        title: title ?? undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        location: location ?? undefined,
        visibility: visibility ?? undefined,
        targetPersonId: visibility === "BRANCH" && targetPersonId ? parseInt(targetPersonId) : (visibility && visibility !== "BRANCH" ? null : undefined),
        // Update families
        sharedFamilies: familyIds ? {
            deleteMany: {},
            create: familyIds.map((fid: any) => ({ familyId: parseInt(fid) }))
        } : undefined,
        // Update guests
        guests: visibility === "RESTRICTED" && guestPersonIds 
          ? {
              deleteMany: {},
              create: guestPersonIds.map((pid: any) => ({ personId: parseInt(pid) })),
            } 
          : (visibility && visibility !== "RESTRICTED" ? { deleteMany: {} } : undefined),
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

    if (event.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.familyEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
