import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

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

    // Check if user is an ACTIVE/PENDING member of the family to allow viewing
    const membership = await prisma.member.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "ACTIVE", // Usually only active members see events
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await prisma.familyEvent.findMany({
      where: { familyId },
      include: {
        _count: {
          select: { media: true }
        }
      },
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("Fetch family events error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
