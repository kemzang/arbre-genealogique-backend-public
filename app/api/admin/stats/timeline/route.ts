import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const superAdmin = await getSuperAdminFromRequest(req);
    if (!superAdmin) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';

    let days = 30;
    let interval: 'day' | 'week' | 'month' = 'day';

    if (period === '7d') days = 7;
    else if (period === '90d') { days = 90; interval = 'week'; }
    else if (period === '1y') { days = 365; interval = 'month'; }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch data
    const [users, families, messages, media] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.family.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.message.findMany({
        where: { sentAt: { gte: startDate } },
        select: { sentAt: true }
      }),
      prisma.media.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      })
    ]);

    // Format data based on intervals
    // For simplicity in this demo backend, we'll group by date string
    const formatData = (data: any[], key: string) => {
      const groups: Record<string, number> = {};
      data.forEach(item => {
        const d = new Date(item[key]);
        const dateStr = d.toISOString().split('T')[0];
        groups[dateStr] = (groups[dateStr] || 0) + 1;
      });
      return Object.entries(groups).map(([date, count]) => ({ date, count }));
    };

    return NextResponse.json({
      period,
      timeline: {
        users: formatData(users, 'createdAt'),
        families: formatData(families, 'createdAt'),
        messages: formatData(messages, 'sentAt'),
        // Media usually follows messages or has its own upload date
        media: formatData(media, 'createdAt')
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch timeline stats" }, { status: 500 });
  }
}
