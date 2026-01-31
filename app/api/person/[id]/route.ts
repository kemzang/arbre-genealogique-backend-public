import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        relationshipsA: {
            include: { personB: true }
        },
        relationshipsB: {
            include: { personA: true }
        },
        media: {
          orderBy: { id: 'desc' },
          take: 10
        }
      }
    });

    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    // Check membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: person.familyId, status: "ACTIVE" }
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Format results to be easier for frontend
    // PARENTAL: A=Parent, B=Child
    const parents = [
        ...person.relationshipsB.filter(r => r.type === "PARENTAL").map(r => r.personA),
    ];
    
    const children = [
        ...person.relationshipsA.filter(r => r.type === "PARENTAL").map(r => r.personB),
    ];

    const spouses = [
        ...person.relationshipsA.filter(r => r.type === "UNION").map(r => r.personB),
        ...person.relationshipsB.filter(r => r.type === "UNION").map(r => r.personA),
    ];

    const siblings = [
        ...person.relationshipsA.filter(r => r.type === "SIBLING").map(r => r.personB),
        ...person.relationshipsB.filter(r => r.type === "SIBLING").map(r => r.personA),
    ];

    return NextResponse.json({
      person,
      parents,
      children,
      spouses,
      siblings
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
