# 📤 Configuration des Uploads de Fichiers

## 🎯 Résumé

L'application supporte maintenant l'upload de fichiers jusqu'à **100MB** avec un timeout de **60 secondes**.

---

## ⚙️ Configuration

### 1. **next.config.ts**

```typescript
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Limite de taille
    },
  },
};
```

### 2. **app/api/media/upload/route.ts**

```typescript
export const maxDuration = 60; // Timeout de 60 secondes
export const dynamic = 'force-dynamic'; // Désactiver le cache
```

---

## 📊 Limites actuelles

| Type | Limite |
|------|--------|
| **Taille maximale** | 100 MB |
| **Timeout** | 60 secondes |
| **Types acceptés** | Tous (IMAGE, VIDEO, FILE) |
| **Stockage** | Local (`public/uploads/`) |

---

## 🔧 Modifier les limites

### Augmenter la taille maximale

Dans `next.config.ts`, changez `bodySizeLimit` :

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '200mb', // Pour 200MB
  },
},
```

### Augmenter le timeout

Dans `app/api/media/upload/route.ts`, changez `maxDuration` :

```typescript
export const maxDuration = 120; // Pour 120 secondes (2 minutes)
```

⚠️ **Attention** : Next.js limite `maxDuration` selon votre plan Vercel :
- **Hobby** : Max 10 secondes
- **Pro** : Max 60 secondes
- **Enterprise** : Max 900 secondes (15 minutes)

En développement local, pas de limite.

---

## 🚨 Erreurs courantes

### "Request body exceeded 10MB"

**Cause** : La configuration n'est pas appliquée ou le serveur n'a pas été redémarré.

**Solution** :
1. Vérifiez que `next.config.ts` contient la configuration `bodySizeLimit`
2. **Redémarrez le serveur** : Ctrl+C puis `npm run dev`

### "Failed to parse body as FormData"

**Cause** : Le fichier est trop gros et a été tronqué avant le parsing.

**Solution** : Augmentez `bodySizeLimit` dans `next.config.ts`

### "Timeout"

**Cause** : Le fichier est trop gros pour être uploadé dans le temps imparti.

**Solutions** :
- Augmentez `maxDuration`
- Compressez le fichier avant upload
- Utilisez un service cloud (S3, Cloudinary) pour les très gros fichiers

---

## 💡 Recommandations

### Pour la production

1. **Utilisez un service cloud** pour les fichiers :
   - AWS S3
   - Cloudinary
   - Google Cloud Storage
   - Azure Blob Storage

2. **Limitez la taille** selon vos besoins :
   - Images : 10-20 MB
   - Vidéos : 100-500 MB
   - Documents : 10-50 MB

3. **Validez côté client** avant l'upload :
   ```javascript
   if (file.size > 100 * 1024 * 1024) {
     alert('Fichier trop volumineux (max 100MB)');
     return;
   }
   ```

4. **Compressez les images** :
   - Utilisez `sharp` côté serveur
   - Ou compressez côté client avec `browser-image-compression`

5. **Ajoutez une barre de progression** :
   ```javascript
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', (e) => {
     const percent = (e.loaded / e.total) * 100;
     console.log(`Upload: ${percent}%`);
   });
   ```

### Pour le développement

- La configuration actuelle (100MB, 60s) est suffisante
- Testez avec différentes tailles de fichiers
- Surveillez les logs pour les erreurs

---

## 📝 Exemple complet avec validation

```javascript
async function uploadFile(file, familyId, token) {
  // Validation de la taille
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 100MB)');
  }

  // Validation du type
  const allowedTypes = {
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'video/mp4': 'VIDEO',
    'video/quicktime': 'VIDEO',
    'application/pdf': 'FILE',
  };

  const mediaType = allowedTypes[file.type];
  if (!mediaType) {
    throw new Error('Type de fichier non supporté');
  }

  // Créer le FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  formData.append('mediaType', mediaType);

  // Upload avec timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

  try {
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout (max 60s)');
    }
    
    throw error;
  }
}
```

---

## 🔍 Débogage

### Vérifier la configuration

```bash
# Vérifier next.config.ts
cat next.config.ts

# Vérifier la route
cat app/api/media/upload/route.ts
```

### Tester avec curl

```bash
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/video.mp4" \
  -F "familyId=1" \
  -F "mediaType=VIDEO"
```

### Logs utiles

Dans le terminal du serveur, vous verrez :
```
📦 FormData reçu: { file: 'video.mp4', familyId: '1', mediaType: 'VIDEO' }
🔍 Validation: { fileName: 'video.mp4', fileSize: 52428800, familyId: 1, mediaType: 'VIDEO' }
✅ Fichier sauvegardé: /uploads/1738065123456-video.mp4 (52428800 bytes)
```

---

## ⚠️ Important

**Après toute modification de `next.config.ts`, vous DEVEZ redémarrer le serveur !**

```bash
# Arrêter le serveur
Ctrl+C

# Relancer
npm run dev
```

---

**Dernière mise à jour** : 28 Janvier 2026
