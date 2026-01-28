# ⚠️ LIMITATION IMPORTANTE - Uploads de fichiers

## 🚨 Problème actuel

**Next.js 16 limite TOUS les uploads à 10MB maximum**, même dans le Pages Router avec `bodyParser: false`.

Cette limite est **hardcodée** dans Next.js et ne peut pas être contournée avec la configuration.

---

## ✅ Ce qui fonctionne

### Endpoint `/api/media/upload-large`
- ✅ **Fichiers < 10MB** : Fonctionne parfaitement
- ❌ **Fichiers > 10MB** : Échoue avec "stream ended unexpectedly"

**Exemple réussi** :
```
✅ Fichier sauvegardé: /uploads/1769603673080-INF467_Support_2_Urbanisation_des_SI_25-26.pdf (835786 bytes)
POST /api/media/upload-large 201 in 53ms
```

---

## 🎯 Solutions

### Solution 1 : Limiter les uploads à 10MB (Temporaire)

**Pour l'instant, acceptez uniquement les fichiers < 10MB.**

Frontend :
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    alert('Fichier trop volumineux. Maximum : 10MB');
    return false;
  }
  return true;
}

// Avant l'upload
if (!validateFile(file)) {
  return;
}

// Upload
const response = await fetch('/api/media/upload-large', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

### Solution 2 : Upload direct vers Cloudinary (Recommandé pour production)

Pour les gros fichiers, uploadez directement vers un service cloud.

#### Installation
```bash
npm install cloudinary
```

#### Configuration backend (`lib/cloudinary.ts`)
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### Endpoint pour obtenir une signature (`pages/api/media/cloudinary-signature.ts`)
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '@/lib/cloudinary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: 'family_tree' },
    process.env.CLOUDINARY_API_SECRET!
  );

  res.json({ timestamp, signature, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
}
```

#### Frontend
```javascript
// 1. Obtenir la signature
const { timestamp, signature, cloudName } = await fetch('/api/media/cloudinary-signature').then(r => r.json());

// 2. Upload direct vers Cloudinary
const formData = new FormData();
formData.append('file', file);
formData.append('timestamp', timestamp);
formData.append('signature', signature);
formData.append('api_key', 'YOUR_API_KEY');
formData.append('folder', 'family_tree');

const cloudinaryResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
  { method: 'POST', body: formData }
);

const { secure_url } = await cloudinaryResponse.json();

// 3. Enregistrer l'URL dans votre BDD
await fetch('/api/media/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyId: 1,
    urlPath: secure_url,
    mediaType: 'VIDEO'
  })
});
```

---

### Solution 3 : Serveur Node.js séparé (Avancé)

Créez un serveur Express séparé pour gérer les uploads :

```javascript
// upload-server.js
const express = require('express');
const multer = require('multer');
const app = express();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

app.listen(3002);
```

Frontend upload vers `http://localhost:3002/upload` au lieu de Next.js.

---

## 📊 Comparaison des solutions

| Solution | Complexité | Limite | Coût | Recommandation |
|----------|------------|--------|------|----------------|
| **Limiter à 10MB** | ⭐ Facile | 10MB | Gratuit | ✅ Court terme |
| **Cloudinary** | ⭐⭐ Moyen | 100MB+ | Freemium | ✅ Production |
| **Serveur séparé** | ⭐⭐⭐ Difficile | Illimité | Hébergement | ⚠️ Si nécessaire |

---

## 🎯 Recommandation finale

### Pour l'instant (développement)
**Limitez les uploads à 10MB** et utilisez `/api/media/upload-large`.

### Pour la production
**Utilisez Cloudinary** ou un service similaire pour les gros fichiers.

---

## 📝 Code frontend recommandé

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function uploadMedia(file, familyId, token) {
  // Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  
  let mediaType = 'FILE';
  if (file.type.startsWith('image/')) mediaType = 'IMAGE';
  if (file.type.startsWith('video/')) mediaType = 'VIDEO';
  formData.append('mediaType', mediaType);

  const response = await fetch('/api/media/upload-large', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}
```

---

## ⚠️ Message d'erreur à afficher

Quand un fichier > 10MB est sélectionné :

```
❌ Fichier trop volumineux

Ce fichier fait [XX]MB. La limite actuelle est de 10MB.

Pour uploader des fichiers plus gros, veuillez :
- Compresser le fichier
- Utiliser un service de partage externe (Google Drive, WeTransfer, etc.)
```

---

**Dernière mise à jour** : 28 Janvier 2026

**Status** : Limitation Next.js 16 - Pas de solution simple pour > 10MB
