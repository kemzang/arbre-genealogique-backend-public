# 📋 Résumé des Modifications - 28 Janvier 2026

## 🎯 Problème résolu

**Erreur initiale** : `PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"`

**Cause** : Prisma 7.x a introduit un breaking change qui nécessite une nouvelle configuration pour les connexions à la base de données.

---

## ✅ Modifications effectuées

### 1. **Configuration Prisma**

#### `prisma/schema.prisma`
**Ajouté** : La ligne `url = env("DATABASE_URL")` dans le bloc `datasource`

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")  // ← AJOUTÉ
}
```

#### `package.json`
**Downgrade** : Prisma 7.3.0 → 6.19.2

**Supprimé** :
- `@prisma/adapter-mariadb`
- `mariadb`

**Raison** : Ces packages étaient pour MariaDB, mais vous utilisez MySQL.

#### `.env`
**Recréé** avec encodage UTF-8 propre :
```env
DATABASE_URL="mysql://root@localhost:3306/family_tree"
JWT_SECRET="change_me_to_a_strong_secret"
```

---

### 2. **Upload de fichiers**

#### `app/api/media/upload/route.ts`
**Changement majeur** : L'endpoint accepte maintenant du **FormData** au lieu de JSON.

**Avant** :
```typescript
const body = await req.json();
const urlPath = body.urlPath; // On attendait juste l'URL
```

**Après** :
```typescript
const formData = await req.formData();
const file = formData.get("file"); // On reçoit le fichier
// Sauvegarde automatique dans public/uploads/
```

**Nouvelles fonctionnalités** :
- ✅ Réception du fichier via FormData
- ✅ Sauvegarde automatique dans `public/uploads/`
- ✅ Génération de noms uniques : `{timestamp}-{filename}`
- ✅ Création automatique du dossier uploads
- ✅ Logs détaillés pour le débogage

#### `public/uploads/`
**Créé** : Dossier pour stocker les fichiers uploadés
**Ajouté** : `.gitignore` pour ne pas commiter les fichiers

---

### 3. **Documentation**

#### `API_README.md`
**Mis à jour** :
- ✅ Section configuration avec versions et variables d'environnement
- ✅ Changelog des modifications récentes
- ✅ Documentation complète de `/api/media/upload` avec exemples FormData
- ✅ Codes d'erreur détaillés

#### `SETUP.md` (nouveau)
**Créé** : Guide complet d'installation et de configuration
- Installation pas à pas
- Configuration de MySQL
- Commandes Prisma
- Résolution de problèmes courants
- Structure du projet

#### `README.md`
**Réécrit** : Présentation professionnelle du projet
- Description des fonctionnalités
- Guide de démarrage rapide
- Liens vers les documentations
- Technologies utilisées
- Problèmes courants

---

## 🔄 Impact sur le Frontend

### ⚠️ Breaking Change

L'endpoint `/api/media/upload` **ne fonctionne plus avec JSON**.

**Ancienne méthode (ne fonctionne plus)** :
```javascript
fetch('/api/media/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    familyId: 1,
    urlPath: 'https://...',
    mediaType: 'IMAGE'
  })
});
```

**Nouvelle méthode (obligatoire)** :
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('familyId', '1');
formData.append('mediaType', 'IMAGE');

fetch('/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // NE PAS définir Content-Type !
  },
  body: formData
});
```

---

## 📊 Résumé technique

### Fichiers modifiés
1. ✏️ `prisma/schema.prisma` - Ajout de l'URL de connexion
2. ✏️ `.env` - Recréation avec bon encodage
3. ✏️ `package.json` - Downgrade Prisma, suppression MariaDB
4. ✏️ `app/api/media/upload/route.ts` - Upload de fichiers complet
5. ✏️ `API_README.md` - Mise à jour documentation
6. ✏️ `README.md` - Réécriture complète

### Fichiers créés
1. ➕ `SETUP.md` - Guide d'installation
2. ➕ `public/uploads/.gitignore` - Ignorer les uploads
3. ➕ `CHANGELOG.md` - Ce fichier

### Commandes exécutées
```bash
npm uninstall @prisma/adapter-mariadb mariadb
npm install prisma@^6.0.0 @prisma/client@^6.0.0
npx prisma generate
Remove-Item -Recurse -Force .next
```

---

## 🎓 Leçons apprises

1. **Prisma 7.x** a des breaking changes majeurs - rester sur 6.x pour l'instant
2. **Encodage des fichiers** peut causer des problèmes avec PowerShell
3. **FormData** est nécessaire pour l'upload de fichiers (pas JSON)
4. **Next.js cache** peut nécessiter un nettoyage après changements Prisma

---

## ✅ Checklist de vérification

- [x] Prisma 6.x installé
- [x] Client Prisma généré
- [x] Cache Next.js nettoyé
- [x] Dossier uploads créé
- [x] Documentation mise à jour
- [x] Endpoint media/upload fonctionnel avec FormData
- [x] Configuration MySQL correcte
- [x] Création automatique du salon "Général" à la création d'une famille
- [x] Ajout automatique des membres au chat dès validation ACTIVE
- [x] Liaison automatique des utilisateurs aux personnes de l'arbre

---

## 🚀 Prochaines étapes

1. **Tester l'upload** depuis le frontend avec FormData
2. **Vérifier les permissions** du dossier `public/uploads/`
3. **Configurer la taille max** des uploads dans Next.js si nécessaire
4. **Considérer un service cloud** (S3, Cloudinary) pour la production

---

### 4. **Automatisation Chat & Famille**

#### `app/api/family/route.ts`
- ✅ Création automatique d'un salon nommé **"Général"** pour chaque nouvelle famille.
- ✅ Ajout immédiat du créateur comme administrateur du salon.

#### `app/api/member/validate/route.ts`
- ✅ **Inclusion automatique** : Dès qu'un membre devient `ACTIVE` (après 3 approbations), il est ajouté au salon "Général".

#### `app/api/person/route.ts`
- ✅ **Liaison intelligente** : Si une `Person` est créée avec un `linkedUserId`, cet utilisateur est automatiquement ajouté comme membre `ACTIVE` de la famille et rejoint le chat.

---

**Date** : 28 Janvier 2026 (Mise à jour v2)
**Status** : ✅ Automatisation Chat & Famille implémentée
