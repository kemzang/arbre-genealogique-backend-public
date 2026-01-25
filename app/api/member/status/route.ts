import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.member.findMany({
      where: { userId: user.id },
      include: { family: true },
    });
    const out = memberships.map((m) => ({
      familyId: m.familyId,
      familyName: m.family.familyName,
      status: m.status,
      role: m.role,
    }));
    return NextResponse.json(out);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 },
    );
  }
}
