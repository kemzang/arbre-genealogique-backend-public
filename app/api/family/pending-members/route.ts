import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // user must be ACTIVE member in at least one family; gather family ids
    const activeMemberships = await prisma.member.findMany({
      where: { userId: user.id, status: "ACTIVE" },
    });
    if (!activeMemberships.length)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const familyIds = activeMemberships.map((m) => m.familyId);

    const pending = await prisma.member.findMany({
      where: { familyId: { in: familyIds }, status: "PENDING" },
      include: { user: true },
    });

    const out = pending.map((p) => ({
      id: p.id,
      familyId: p.familyId,
      userId: p.userId,
      userEmail: p.user.email,
      joinedAt: p.joinedAt,
    }));
    return NextResponse.json(out);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch pending members" },
      { status: 500 },
    );
  }
}
