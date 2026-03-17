import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = idStr;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        relationshipsA: {
            where: { deletedAt: null },
            include: { 
              personB: true 
            },
            orderBy: [
              { status: 'asc' }, // ACTIVE first
              { startDate: 'desc' } // Most recent first
            ]
        },
        relationshipsB: {
            where: { deletedAt: null },
            include: { 
              personA: true 
            },
            orderBy: [
              { status: 'asc' }, // ACTIVE first
              { startDate: 'desc' } // Most recent first
            ]
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

    // Format results with historical information
    // PARENTAL: A=Parent, B=Child
    const parents = [
        ...person.relationshipsB.filter(r => r.type === "PARENTAL").map(r => ({
          ...r.personA,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
    ];
    
    const children = [
        ...person.relationshipsA.filter(r => r.type === "PARENTAL").map(r => ({
          ...r.personB,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
    ];

    // Spouses with full history (current and ex-spouses)
    const allSpouses = [
        ...person.relationshipsA.filter(r => r.type === "UNION").map(r => ({
          ...r.personB,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
        ...person.relationshipsB.filter(r => r.type === "UNION").map(r => ({
          ...r.personA,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
    ];

    // Separate current and former spouses
    const currentSpouses = allSpouses.filter(s => s.relationshipInfo.status === "ACTIVE");
    const formerSpouses = allSpouses.filter(s => s.relationshipInfo.status !== "ACTIVE");

    const siblings = [
        ...person.relationshipsA.filter(r => r.type === "SIBLING").map(r => ({
          ...r.personB,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
        ...person.relationshipsB.filter(r => r.type === "SIBLING").map(r => ({
          ...r.personA,
          relationshipInfo: {
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            endReason: r.endReason,
            isBiological: r.isBiological,
            notes: r.notes
          }
        })),
    ];

    // Relationship history summary
    const relationshipHistory = {
      totalMarriages: allSpouses.length,
      currentMarriages: currentSpouses.length,
      divorces: formerSpouses.filter(s => 
        s.relationshipInfo.endReason?.toLowerCase().includes('divorce') ||
        s.relationshipInfo.endReason?.toLowerCase().includes('divorcé')
      ).length,
      widowed: formerSpouses.filter(s => 
        s.relationshipInfo.status === "DECEASED" ||
        s.relationshipInfo.endReason?.toLowerCase().includes('décès') ||
        s.relationshipInfo.endReason?.toLowerCase().includes('death')
      ).length
    };

    return NextResponse.json({
      person,
      parents,
      children,
      currentSpouses,
      formerSpouses,
      allSpouses, // Complete history
      siblings,
      relationshipHistory
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = idStr;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, birthDate, deathDate, gender, bio, profilePictureUrl } = body;

    // Get person to check family membership
    const person = await prisma.person.findUnique({
      where: { id }
    });

    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    // Check if user is an active member with ADMIN or EDITOR role
    const member = await prisma.member.findFirst({
      where: { 
        userId: user.id, 
        familyId: person.familyId, 
        status: "ACTIVE",
        role: { in: ["ADMIN", "EDITOR"] }
      }
    });

    if (!member) return NextResponse.json({ error: "Forbidden: You must be an admin or editor" }, { status: 403 });

    // Update person
    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
    if (deathDate !== undefined) data.deathDate = deathDate ? new Date(deathDate) : null;
    if (gender !== undefined) data.gender = gender;
    if (bio !== undefined) data.bio = bio;
    if (profilePictureUrl !== undefined) data.profilePictureUrl = profilePictureUrl;

    const updatedPerson = await prisma.person.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedPerson);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update person" }, { status: 500 });
  }
}

