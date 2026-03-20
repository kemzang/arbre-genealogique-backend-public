import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const familyId = url.searchParams.get("familyId");
    const sinceParam = url.searchParams.get("since");

    if (!familyId) {
      return NextResponse.json({ error: "familyId required" }, { status: 400 });
    }

    // Verify user is ACTIVE member of this family
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    const now = new Date();

    // --- Persons ---
    const personsUpserted = await prisma.person.findMany({
      where: { familyId, updatedAt: { gt: since }, deletedAt: null },
    });
    const personsDeleted = await prisma.person.findMany({
      where: { familyId, deletedAt: { not: null, gt: since } },
      select: { id: true },
    });

    // --- Relationships ---
    // Get all person IDs in this family (including deleted) for relationship lookup
    const familyPersonIds = (
      await prisma.person.findMany({
        where: { familyId },
        select: { id: true },
      })
    ).map((p) => p.id);

    const relationshipsUpserted = await prisma.relationship.findMany({
      where: {
        OR: [
          { personAId: { in: familyPersonIds } },
          { personBId: { in: familyPersonIds } },
        ],
        updatedAt: { gt: since },
        deletedAt: null,
      },
    });
    const relationshipsDeleted = await prisma.relationship.findMany({
      where: {
        OR: [
          { personAId: { in: familyPersonIds } },
          { personBId: { in: familyPersonIds } },
        ],
        deletedAt: { not: null, gt: since },
      },
      select: { id: true },
    });

    // --- Events ---
    const eventsUpserted = await prisma.familyEvent.findMany({
      where: {
        sharedFamilies: { some: { familyId } },
        updatedAt: { gt: since },
        deletedAt: null,
      },
      include: {
        guests: true,
        sharedFamilies: true,
      },
    });
    const eventsDeleted = await prisma.familyEvent.findMany({
      where: {
        sharedFamilies: { some: { familyId } },
        deletedAt: { not: null, gt: since },
      },
      select: { id: true },
    });

    // --- ChatRooms ---
    const chatRoomsUpserted = await prisma.chatRoom.findMany({
      where: { familyId, updatedAt: { gt: since }, deletedAt: null },
    });
    const chatRoomsDeleted = await prisma.chatRoom.findMany({
      where: { familyId, deletedAt: { not: null, gt: since } },
      select: { id: true },
    });

    // --- Messages ---
    const familyChatRoomIds = (
      await prisma.chatRoom.findMany({
        where: { familyId },
        select: { id: true },
      })
    ).map((r) => r.id);

    const messagesUpserted = await prisma.message.findMany({
      where: {
        chatRoomId: { in: familyChatRoomIds },
        updatedAt: { gt: since },
        deletedAt: null,
      },
      include: { attachments: true },
    });
    const messagesDeleted = await prisma.message.findMany({
      where: {
        chatRoomId: { in: familyChatRoomIds },
        deletedAt: { not: null, gt: since },
      },
      select: { id: true },
    });

    return NextResponse.json({
      persons: {
        upserted: personsUpserted,
        deleted: personsDeleted.map((p) => p.id),
      },
      relationships: {
        upserted: relationshipsUpserted,
        deleted: relationshipsDeleted.map((r) => r.id),
      },
      events: {
        upserted: eventsUpserted,
        deleted: eventsDeleted.map((e) => e.id),
      },
      chatRooms: {
        upserted: chatRoomsUpserted,
        deleted: chatRoomsDeleted.map((r) => r.id),
      },
      messages: {
        upserted: messagesUpserted,
        deleted: messagesDeleted.map((m) => m.id),
      },
      syncedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
