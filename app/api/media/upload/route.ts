import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const familyId: number = body.familyId;
    const personId: number | undefined = body.personId;
    const urlPath: string = body.urlPath;
    const mediaType: "IMAGE" | "VIDEO" = body.mediaType || "IMAGE";

    if (!familyId || !urlPath)
      return NextResponse.json(
        { error: "familyId and urlPath required" },
        { status: 400 },
      );

    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!member)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data: any = { familyId, uploaderId: user.id, urlPath, mediaType };
    if (personId) data.personId = personId;

    const media = await prisma.media.create({ data });
    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 },
    );
  }
}
