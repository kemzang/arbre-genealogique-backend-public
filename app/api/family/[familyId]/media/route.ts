import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fId = familyId;
    if (!fId)
      return NextResponse.json({ error: "Invalid family ID" }, { status: 400 });

    // Check membership
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId: fId, status: "ACTIVE" },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const chatRoomId = url.searchParams.get("chatRoomId");

    const where: any = { familyId: fId };
    if (type) {
      if (["IMAGE", "VIDEO", "FILE"].includes(type)) {
        where.mediaType = type;
      }
    }
    if (chatRoomId) {
       where.message = { chatRoomId: chatRoomId };
    }

    const media = await prisma.media.findMany({
      where,
      include: {
        uploader: { select: { displayName: true } },
        person: { select: { firstName: true, lastName: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(media);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
}
