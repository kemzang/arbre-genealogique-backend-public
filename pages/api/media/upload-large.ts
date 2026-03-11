import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import jwt from 'jsonwebtoken';

// Désactiver le bodyParser de Next.js pour gérer les fichiers
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper pour obtenir l'utilisateur depuis le token
async function getUserFromToken(req: NextApiRequest) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { sub?: number };
    if (!decoded?.sub) return null;

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ajouter les headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Vérifier l'authentification
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Configurer formidable pour parser en mémoire
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    // Parser le formulaire
    const [fields, files] = await form.parse(req);

    console.log('📦 Fields:', fields);
    console.log('📦 Files:', files);

    // Récupérer les données
    const file = files.file?.[0];
    const familyIdStr = fields.familyId?.[0];
    const personIdStr = fields.personId?.[0];
    const eventIdStr = fields.eventId?.[0];
    const mediaType = (fields.mediaType?.[0] as 'IMAGE' | 'VIDEO' | 'FILE') || 'IMAGE';

    if (!file || !familyIdStr) {
      return res.status(400).json({ error: 'familyId and file required' });
    }

    const familyId = parseInt(familyIdStr);
    const personId = personIdStr ? parseInt(personIdStr) : undefined;
    const eventId = eventIdStr ? parseInt(eventIdStr) : undefined;

    console.log('🔍 Validation:', {
      fileName: file.originalFilename,
      fileSize: file.size,
      familyId,
      mediaType,
    });

    // Vérifier que l'utilisateur est membre actif de la famille
    const member = await prisma.member.findFirst({
      where: { userId: user.id, familyId, status: 'ACTIVE' },
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Lire le fichier en buffer
    const fileBuffer = await fs.readFile(file.filepath);

    // Déterminer le dossier Cloudinary selon le type
    let folder = 'media';
    if (personId) folder = 'profiles';
    else if (eventId) folder = 'events';

    // Upload vers Cloudinary
    console.log('☁️ Upload vers Cloudinary...');
    const uploadResult = await uploadToCloudinary(fileBuffer, folder);
    const urlPath = uploadResult.secure_url;

    console.log('✅ Fichier uploadé sur Cloudinary:', urlPath);

    // Supprimer le fichier temporaire
    await fs.unlink(file.filepath).catch(() => {});

    // Enregistrer dans la base de données
    const data: any = { familyId, uploaderId: user.id, urlPath, mediaType };
    if (personId) data.personId = personId;
    if (eventId) data.eventId = eventId;

    const media = await prisma.media.create({ data });

    return res.status(201).json(media);
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    return res.status(500).json({
      error: 'Failed to upload media',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
