# 🚨 Solution pour les uploads > 10MB

## ⚠️ Problème

Next.js App Router limite les uploads à **10MB** sans possibilité simple de changer cette limite.

## ✅ Solution

J'ai créé un **nouvel endpoint** dans le Pages Router qui supporte les fichiers jusqu'à **100MB**.

---

## 📍 Nouveaux endpoints

### Pour les petits fichiers (< 10MB)
```
POST /api/media/upload
```
- Utilise App Router
- Limite : 10MB
- Rapide et simple

### Pour les gros fichiers (< 100MB) ⭐
```
POST /api/media/upload-large
```
- Utilise Pages Router + formidable
- Limite : 100MB
- **Utilisez celui-ci pour les vidéos !**

---

## 🔄 Changement pour le frontend

### Avant
```javascript
fetch('/api/media/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Maintenant (pour les gros fichiers)
```javascript
fetch('/api/media/upload-large', {  // ← Changé ici
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## 💡 Recommandation

Utilisez une logique conditionnelle dans le frontend :

```javascript
async function uploadFile(file, familyId, token) {
  // Choisir l'endpoint selon la taille
  const endpoint = file.size > 10 * 1024 * 1024 
    ? '/api/media/upload-large'  // > 10MB
    : '/api/media/upload';        // ≤ 10MB

  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  
  // Déterminer le type automatiquement
  let mediaType = 'FILE';
  if (file.type.startsWith('image/')) mediaType = 'IMAGE';
  if (file.type.startsWith('video/')) mediaType = 'VIDEO';
  formData.append('mediaType', mediaType);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}
```

---

## 📊 Comparaison

| Endpoint | Limite | Technologie | Usage |
|----------|--------|-------------|-------|
| `/api/media/upload` | 10 MB | App Router | Images, petits fichiers |
| `/api/media/upload-large` | 100 MB | Pages Router + formidable | Vidéos, gros fichiers |

---

## 🎯 Pour les vidéos

**Utilisez toujours `/api/media/upload-large`** pour les vidéos car elles dépassent généralement 10MB.

---

## ✅ Testé et fonctionnel

L'endpoint `/api/media/upload-large` :
- ✅ Accepte les fichiers jusqu'à 100MB
- ✅ Utilise la même authentification JWT
- ✅ Sauvegarde dans `public/uploads/`
- ✅ Enregistre dans la base de données
- ✅ Retourne le même format de réponse

---

## 🔍 Logs

Vous verrez dans le terminal :
```
📦 Fields: { familyId: ['1'], mediaType: ['VIDEO'] }
📦 Files: { file: [{ originalFilename: 'video.mp4', size: 52428800, ... }] }
🔍 Validation: { fileName: 'video.mp4', fileSize: 52428800, familyId: 1, mediaType: 'VIDEO' }
✅ Fichier sauvegardé: /uploads/1738065123456-video.mp4 (52428800 bytes)
```

---

## ⚠️ Pas besoin de redémarrer

L'endpoint est prêt à l'emploi immédiatement !

---

**Utilisez `/api/media/upload-large` pour les vidéos et gros fichiers ! 🎥**
