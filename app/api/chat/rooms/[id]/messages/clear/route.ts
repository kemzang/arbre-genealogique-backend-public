import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// DELETE /api/chat/rooms/:id/messages/clear
// Clears the chat history for the current user only (sets clearedAt timestamp).
// Messages sent before clearedAt are hidden for this user on the client side.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatRoomId } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const participant = await prisma.chatRoomParticipant.findFirst({
      where: { chatRoomId, userId: user.id, leftAt: null },
    });
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant of this room" }, { status: 403 });
    }

    await prisma.chatRoomParticipant.update({
      where: { id: participant.id },
      data: { clearedAt: new Date() },
    });

    return NextResponse.json({ success: true, clearedAt: new Date() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear messages" }, { status: 500 });
  }
}
