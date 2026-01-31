import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

/**
 * Helper to check if two persons are in the same kinship branch.
 * For now, we'll use a simplified version: if they share any common ancestor 
 * or one is an ancestor of the other.
 */
async function belongsToBranch(personId: number, targetPersonId: number): Promise<boolean> {
    if (personId === targetPersonId) return true;
    
    // We'll perform a BFS/DFS to find if they are related.
    // In a family tree, most active members of a "branch" are within a few degrees of separation.
    // To be efficient, we'll check up to 5 levels of separation.
    
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

            // Find all relatives (Parents, Children, Siblings, Spouses)
            const relations = await prisma.relationship.findMany({
                where: {
                    OR: [
                        { personAId: currentId },
                        { personBId: currentId }
                    ]
                }
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId: familyIdStr } = await params;
    const familyId = parseInt(familyIdStr);

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an ACTIVE member of the family
    const membership = await prisma.member.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "ACTIVE",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the person linked to this user
    const linkedPerson = await prisma.person.findFirst({
        where: { linkedUserId: user.id, familyId }
    });

    // Fetch all events for this family
    const allEvents = await prisma.familyEvent.findMany({
      where: {
        sharedFamilies: {
            some: { familyId }
        }
      },
      include: {
        _count: {
          select: { media: true }
        },
        creator: {
            select: { displayName: true }
        },
        guests: true
      },
      orderBy: { eventDate: "desc" },
    });

    // Filter events based on visibility rules
    const filteredEvents = [];
    for (const event of allEvents) {
        // 1. PUBLIC -> everyone in family sees it
        if (event.visibility === "PUBLIC") {
            filteredEvents.push(event);
            continue;
        }

        // 2. User is Creator -> always sees it
        if (event.creatorId === user.id) {
            filteredEvents.push(event);
            continue;
        }

        // 3. PRIVATE -> only creator (already handled above)
        if (event.visibility === "PRIVATE") continue;

        // 4. RESTRICTED -> only guests
        if (event.visibility === "RESTRICTED") {
            if (linkedPerson && event.guests.some(g => g.personId === linkedPerson.id)) {
                filteredEvents.push(event);
            }
            continue;
        }

        // 5. BRANCH -> target branch logic
        if (event.visibility === "BRANCH" && event.targetPersonId) {
            if (linkedPerson) {
                const isRelated = await belongsToBranch(linkedPerson.id, event.targetPersonId);
                if (isRelated) {
                    filteredEvents.push(event);
                }
            }
            continue;
        }
    }

    return NextResponse.json(filteredEvents);
  } catch (err) {
    console.error("Fetch family events error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
