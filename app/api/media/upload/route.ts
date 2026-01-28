import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Configuration de la taille maximale pour les uploads (100MB)
export const maxDuration = 60; // Timeout de 60 secondes
export const dynamic = 'force-dynamic'; // Désactiver le cache

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parser le FormData
    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error("❌ Erreur parsing FormData:", error);
      return NextResponse.json(
        { error: "Invalid FormData" },
        { status: 400 }
      );
    }

    console.log("📦 FormData reçu:", Object.fromEntries(formData));
    
    const file = formData.get("file") as File | null;
    const familyIdStr = formData.get("familyId") as string | null;
    const personIdStr = formData.get("personId") as string | null;
    const mediaType = (formData.get("mediaType") as "IMAGE" | "VIDEO" | "FILE") || "IMAGE";

    const familyId = familyIdStr ? parseInt(familyIdStr) : null;
    const personId = personIdStr ? parseInt(personIdStr) : undefined;

    console.log("🔍 Validation:", { 
      fileName: file?.name, 
      fileSize: file?.size,
      familyId, 
      mediaType 
    });

    if (!familyId || !file) {
      console.error("❌ Validation failed:", { familyId, file: !!file });
      return NextResponse.json(
        { error: "familyId and file required" },
        { status: 400 },
      );
    }

    // Vérifier que c'est bien un fichier
    if (!file.name || file.size === 0) {
      return NextResponse.json(
        { error: "Invalid file" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: "ACTIVE" },
    });
    if (!member)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(uploadDir, fileName);
    const urlPath = `/uploads/${fileName}`;

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log("✅ Fichier sauvegardé:", urlPath, `(${file.size} bytes)`);

    // Enregistrer dans la base de données
    const data: any = { familyId, uploaderId: user.id, urlPath, mediaType };
    if (personId) data.personId = personId;

    const media = await prisma.media.create({ data });
    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    console.error("❌ Erreur upload:", err);
    return NextResponse.json(
      { error: "Failed to upload media", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
