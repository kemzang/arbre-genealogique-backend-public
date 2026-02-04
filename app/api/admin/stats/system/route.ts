import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const superAdmin = await getSuperAdminFromRequest(req);
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    // 1. Storage Approximation (based on counts, assuming average sizes)
    const mediaCounts = await prisma.media.groupBy({
      by: ['mediaType'],
      _count: { _all: true }
    });

    const averageSizes: Record<string, number> = {
      'IMAGE': 2 * 1024 * 1024, // 2MB
      'VIDEO': 15 * 1024 * 1024, // 15MB
      'FILE': 1 * 1024 * 1024   // 1MB
    };

    const storageUsage = mediaCounts.map(m => ({
      type: m.mediaType,
      count: m._count._all,
      estimatedSizeByte: m._count._all * (averageSizes[m.mediaType] || 1024 * 1024)
    }));

    // 2. Performance & Health (Static for now as it requires server-side monitoring tools)
    const systemHealth = {
      status: "Healthy",
      uptime: process.uptime(),
      averageResponseTimeMs: 45, // Placeholder
      memoryUsage: process.memoryUsage(),
    };

    return NextResponse.json({
      storage: storageUsage,
      health: systemHealth,
      database: {
        totalRowsEstimate: await getTotalRowCount()
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 });
  }
}

async function getTotalRowCount() {
  const [users, families, members, persons, relationships, messages, media] = await Promise.all([
    prisma.user.count(),
    prisma.family.count(),
    prisma.member.count(),
    prisma.person.count(),
    prisma.relationship.count(),
    prisma.message.count(),
    prisma.media.count()
  ]);
  return users + families + members + persons + relationships + messages + media;
}
