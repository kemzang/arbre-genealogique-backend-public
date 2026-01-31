import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("name") || url.searchParams.get("q") || "";
    const user = await getUserFromRequest(req);

    const families = await prisma.family.findMany({
      where: {
        familyName: { contains: q },
      },
      take: 50,
    });

    // if user present, add isMember flag
    if (user) {
      const familyIds = families.map((f) => f.id);
      const memberships = await prisma.member.findMany({
        where: { userId: user.id, familyId: { in: familyIds } },
      });
      const memberSet = new Set(memberships.map((m) => m.familyId));
      const out = families.map((f) => ({
        ...f,
        isMember: memberSet.has(f.id),
      }));
      return NextResponse.json(out);
    }

    return NextResponse.json(families);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
