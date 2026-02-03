import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function getUserFromRequest(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret) as {
      sub?: number;
      email?: string;
    } | null;
    if (!decoded?.sub) return null;
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    return user;
  } catch (err) {
    console.error("getUserFromRequest error", err);
    return null;
  }
}

export async function getSuperAdminFromRequest(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.isSuperAdmin) return null;
  return user;
}

export async function requireSuperAdmin(req: Request) {
  const superAdmin = await getSuperAdminFromRequest(req);
  if (!superAdmin) {
    throw new Error("Super admin access required");
  }
  return superAdmin;
}
