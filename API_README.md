# Documentation API Backend

Ce document recense tous les endpoints disponibles dans le backend, leur rôle, le format du corps de la requête (body) attendu et le format de la réponse.

## ⚙️ Configuration

### Base de données
- **Type** : MySQL
- **ORM** : Prisma 6.x
- **Connexion** : Configurée via la variable d'environnement `DATABASE_URL`

### Variables d'environnement (`.env`)
```env
DATABASE_URL="mysql://root@localhost:3306/family_tree"
JWT_SECRET="change_me_to_a_strong_secret"
```

### Versions importantes
- **Prisma** : 6.19.2 (⚠️ Ne pas upgrader vers Prisma 7.x sans migration)
- **Next.js** : 16.1.4
- **Node.js** : 20+

### Structure des fichiers uploadés
- **Dossier** : `public/uploads/`
- **Format des noms** : `{timestamp}-{filename}` (ex: `1738065123456-photo.jpg`)
- **Accès** : Les fichiers sont accessibles via `/uploads/{filename}`

---

## 📝 Changelog récent

### 2026-01-28 - Upload de fichiers
- ✅ Modification de `/api/media/upload` pour accepter les fichiers via FormData
- ✅ Sauvegarde automatique des fichiers dans `public/uploads/`
- ✅ Génération de noms de fichiers uniques avec timestamp
- ⚠️ **Breaking change** : L'endpoint n'accepte plus de JSON avec `urlPath`, il faut maintenant envoyer le fichier directement

### 2026-01-28 - Configuration Prisma
- ✅ Downgrade de Prisma 7.x vers 6.x pour compatibilité
- ✅ Ajout de `url = env("DATABASE_URL")` dans `schema.prisma`
- ✅ Suppression des dépendances MariaDB (`@prisma/adapter-mariadb`, `mariadb`)
- ✅ Configuration pour MySQL natif

---

## Authentification

### `POST /api/users`
**Rôle :** Créer un nouveau compte utilisateur.
**Body :**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Jean Dupont" // Optionnel
}
```
**Réponse (201 Created) :**
```json
{
  "id": 1,
  "email": "user@example.com",
  "displayName": "Jean Dupont",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```
**Erreurs possibles :**
- 400: Email et mot de passe requis
- 409: Un utilisateur avec cet e-mail existe déjà

### `POST /api/users/login`
**Rôle :** Connecter un utilisateur et obtenir un token JWT.
**Body :**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Réponse (200 OK) :**
```json
{
  "token": "eyJh...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Jean Dupont",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
**Erreurs possibles :**
- 400: Email et mot de passe requis
- 401: Identifiants invalides

---

## Famille

### `POST /api/family`
**Rôle :** Créer une nouvelle famille. 
- L'utilisateur courant devient **ADMIN** et membre **ACTIF**.
- Un salon de discussion nommé **"Général"** est créé automatiquement.
- Le créateur est automatiquement ajouté comme participant du salon Général.
**Header :** `Authorization: Bearer <token>` (via cookie ou header selon l'implémentation auth)
**Body :**
```json
{
  "familyName": "Famille Dupont"
}
```
**Réponse (201 Created) :**
```json
{
  "id": 1,
  "familyName": "Famille Dupont",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `POST /api/family/join`
**Rôle :** Demander à rejoindre une famille existante.
**Body :**
```json
{
  "familyId": 1,
  "gender": "M", // "M", "F", "O"
  "relatedToPersonId": 5,
  "relationshipType": "PARENTAL" // "PARENTAL", "UNION", "SIBLING"
}
```
**Réponse (201 Created) :**
L'objet `Member` créé avec le statut `PENDING`.
```json
{
  "id": 10,
  "userId": 1,
  "familyId": 1,
  "role": "VIEWER",
  "status": "PENDING",
  "applicationData": { ... }
}
```

### `GET /api/family/search?name=...`
**Rôle :** Rechercher des familles par nom.
**Query Params :** 
- `name` ou `q` : Partie du nom de famille recherché.
**Réponse (200 OK) :**
Liste des familles correspondantes. Si l'utilisateur est connecté, un champ `isMember` est ajouté.
```json
[
  {
    "id": 1,
    "familyName": "Famille Dupont",
    "logoUrl": "...",
    "createdAt": "...",
    "isMember": true
  }
]
```

### `GET /api/family/pending-members`
**Rôle :** Récupérer la liste des demandes d'adhésion en attente pour les familles dont l'utilisateur est membre ACTIF.
**Réponse (200 OK) :**
```json
[
  {
    "id": 10, // ID du membre (membership)
    "familyId": 1,
    "userId": 5,
    "userEmail": "demandeur@example.com",
    "joinedAt": "...",
    "applicationData": {
       "gender": "M",
       "relatedToPersonId": 5,
       "relationshipType": "PARENTAL"
    }
  }
]
```

---

## Membres

### `GET /api/member/status`
**Rôle :** Obtenir la liste des familles auxquelles l'utilisateur appartient et son statut dans chacune.
**Réponse (200 OK) :**
```json
[
  {
    "familyId": 1,
    "familyName": "Famille Dupont",
    "status": "ACTIVE", // ou "PENDING"
    "role": "ADMIN" // ou "VIEWER", "EDITOR"
  }
]
```

### `POST /api/member/validate`
**Rôle :** Voter pour approuver ou rejeter un nouveau membre. (Nécessite 3 approbations pour passer ACTIF).
**Body :**
```json
{
  "targetMemberId": 10,
  "vote": "APPROVE" // ou "REJECT"
}
```
**Réponse (200 OK) :**
```json
{
  "success": true
}
```
**Notes :**
- Lorsqu'un membre reçoit au moins **3 votes APPROVE**, son statut passe automatiquement à **ACTIVE**.
- Dès qu'un membre devient **ACTIVE**, il est automatiquement ajouté comme participant au salon de discussion **"Général"** de la famille.

---

## Arbre Généalogique & Personnes

### `GET /api/tree?familyId=...`
**Rôle :** Récupérer toutes les personnes et relations d'une famille pour construire l'arbre.
**Query Params :** `familyId` (Optionnel si l'utilisateur n'a qu'une famille active, sinon requis)
**Réponse (200 OK) :**
```json
{
  "persons": [
    {
      "id": 1,
      "firstName": "Jean",
      "lastName": "Dupont",
      "birthDate": "1980-01-01T00:00:00.000Z",
      ...
    }
  ],
  "relationships": [
    {
      "id": 1,
      "personAId": 1,
      "personBId": 2,
      "type": "PARENTAL", // "PARENTAL", "UNION", "SIBLING"
      "isBiological": true
    }
  ]
}
```

### Workflow : Constituer son arbre (Convention Backend)
Pour assurer un rendu correct, suivez toujours cette convention pour `personAId` et `personBId` :

#### 1. Relation Parentale (`type: "PARENTAL"`)
- **`personAId`** : TOUJOURS le **Parent** (père ou mère).
- **`personBId`** : TOUJOURS l'**Enfant**.
- *Note : Si l'enfant a deux parents, créez deux relations distinctes (Père->Enfant et Mère->Enfant).*

#### 2. Relation d'Union (`type: "UNION"`)
- **`personAId`** et **`personBId`** : Les deux conjoints (l'ordre n'a pas d'importance).

#### 3. Relation Fratrie (`type: "SIBLING"`)
- **`personAId`** et **`personBId`** : Les deux frères/sœurs (l'ordre n'a pas d'importance).
  *Note : Bien que l'arbre puisse être déduit des liens PARENTAL, ce lien peut servir pour des cas spécifiques.*

### Étapes Séquentielles pour le Front-end :
1. **Créer les personnes** individuellement via `POST /api/person`.
2. **Récupérer les IDs** (ex: IdPère=10, IdMère=11, IdEnfant=12).
3. **Lier le Père à l'Enfant** : `personAId: 10`, `personBId: 12`, `type: "PARENTAL"`
4. **Lier la Mère à l'Enfant** : `personAId: 11`, `personBId: 12`, `type: "PARENTAL"`
5. **Lier les Conjoints** : `personAId: 10`, `personBId: 11`, `type: "UNION"`
```

### `POST /api/person`
**Rôle :** Ajouter une nouvelle fiche de personne dans l'arbre.
**Body :**
```json
{
  "familyId": 1,
  "firstName": "Marie",
  "lastName": "Curie",
  "birthDate": "1867-11-07",
  "deathDate": "1934-07-04",
  "gender": "F", // "M", "F", "O"
  "bio": "Physicienne et chimiste...",
  "linkedUserId": 5
}
```
**Réponse (201 Created) :**
Objet `Person` créé.

### `POST /api/relationship`
**Rôle :** Créer un lien de parenté entre deux personnes existantes.
**Body :**
```json
{
  "personAId": 1,
  "personBId": 2,
  "type": "UNION", // "PARENTAL", "UNION", "SIBLING"
  "isBiological": true
}
```
**Réponse (201 Created) :**
Objet `Relationship` créé.

### `GET /api/relationship/[id]` ⭐ (Nouveau)
**Rôle :** Obtenir les détails d'une relation. Pour une `UNION`, retourne aussi la liste des enfants communs identifiés.
**Réponse (200 OK) :**
```json
{
  "relationship": {
    "id": 1,
    "personAId": 1,
    "personBId": 2,
    "type": "UNION",
    "personA": { "id": 1, "firstName": "Jean", ... },
    "personB": { "id": 2, "firstName": "Marie", ... }
  },
  "children": [
    { "id": 3, "firstName": "Théo", ... }
  ]
}
```

### `GET /api/person/[id]` ⭐ (Nouveau)
**Rôle :** Obtenir les détails complets d'une personne : parents, enfants, conjoints et frères/sœurs.
**Réponse (200 OK) :**
```json
{
  "person": { "id": 1, "firstName": "Jean", "bio": "...", "media": [...] },
  "parents": [...],
  "children": [...],
  "spouses": [...],
  "siblings": [...]
}
```

### `PATCH /api/relationship/[id]`
**Rôle :** Modifier une relation existante (type ou caractère biologique).
**Body :**
```json
{
  "type": "SIBLING",
  "isBiological": false
}
```
**Réponse (200 OK) :**
Objet `Relationship` mis à jour.

### `DELETE /api/relationship/[id]`
**Rôle :** Supprimer une relation.
**Réponse (200 OK) :**
`{ "success": true }`

---

---

## Média

⚠️ **Deux endpoints disponibles selon la taille du fichier** :
- `/api/media/upload` - Pour les fichiers ≤ 10MB
- `/api/media/upload-large` - Pour les fichiers ≤ 100MB (recommandé pour les vidéos)

### `POST /api/media/upload`
**Rôle :** Uploader un petit fichier (≤ 10MB) et enregistrer ses métadonnées.

**⚠️ Limite :** 10MB maximum

**⚠️ Important :** Cet endpoint accepte du **FormData**, pas du JSON.

**Headers :**
- `Authorization: Bearer <token>` (obligatoire)
- ⚠️ **NE PAS** définir `Content-Type` - le navigateur le gère automatiquement

**FormData Fields :**
- `file` (obligatoire) : Le fichier à uploader (File object)
- `familyId` (obligatoire) : ID de la famille (string ou number)
- `mediaType` (optionnel) : Type de média - `"IMAGE"`, `"VIDEO"`, ou `"FILE"` (défaut: `"IMAGE"`)
- `personId` (optionnel) : ID de la personne à lier au média
- `eventId` (optionnel) : ID de l'événement à lier au média

**Exemple JavaScript :**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('familyId', '1');
formData.append('mediaType', 'IMAGE');
// formData.append('personId', '5'); // Optionnel

const response = await fetch('/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // NE PAS définir Content-Type !
  },
  body: formData
});
```

**Réponse (201 Created) :**
```json
{
  "id": 123,
  "familyId": 1,
  "uploaderId": 1,
  "urlPath": "/uploads/1738065123456-photo.jpg",
  "mediaType": "IMAGE",
  "personId": null,
  "eventId": null,
  "messageId": null
}
```

**Erreurs possibles :**
- **400** : `familyId` ou `file` manquant
  ```json
  { "error": "familyId and file required" }
  ```
- **401** : Token JWT manquant ou invalide
  ```json
  { "error": "Unauthorized" }
  ```
- **403** : L'utilisateur n'est pas membre actif de la famille
  ```json
  { "error": "Forbidden" }
  ```
- **500** : Erreur serveur (problème d'écriture du fichier, etc.)
  ```json
  { "error": "Failed to upload media" }
  ```

**Notes :**
- Les fichiers sont sauvegardés dans `public/uploads/` avec un nom unique : `{timestamp}-{filename}`
- L'URL retournée (`urlPath`) est accessible directement : `http://localhost:3001/uploads/...`
- **Taille maximale : 10MB**
- Pour les fichiers plus gros, utilisez `/api/media/upload-large`

---

### `POST /api/media/upload-large` ⭐
**Rôle :** Uploader un gros fichier (≤ 100MB) et enregistrer ses métadonnées.

**⚠️ Recommandé pour les vidéos !**

**⚠️ Important :** Cet endpoint accepte du **FormData**, pas du JSON.

**Headers :**
- `Authorization: Bearer <token>` (obligatoire)
- ⚠️ **NE PAS** définir `Content-Type` - le navigateur le gère automatiquement

**FormData Fields :**
- `file` (obligatoire) : Le fichier à uploader (File object)
- `familyId` (obligatoire) : ID de la famille (string ou number)
- `mediaType` (optionnel) : Type de média - `"IMAGE"`, `"VIDEO"`, ou `"FILE"` (défaut: `"IMAGE"`)
- `personId` (optionnel) : ID de la personne à lier au média
- `eventId` (optionnel) : ID de l'événement à lier au média

**Exemple JavaScript :**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('familyId', '1');
formData.append('mediaType', 'VIDEO'); // Pour une vidéo
// formData.append('personId', '5'); // Optionnel

const response = await fetch('/api/media/upload-large', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // NE PAS définir Content-Type !
  },
  body: formData
});
```

**Exemple avec choix automatique de l'endpoint :**
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
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  return await response.json();
}
```

**Réponse (201 Created) :**
```json
{
  "id": 123,
  "familyId": 1,
  "uploaderId": 1,
  "urlPath": "/uploads/1738065123456-video.mp4",
  "mediaType": "VIDEO",
  "personId": null,
  "eventId": null,
  "messageId": null
}
```

**Erreurs possibles :**
- **400** : `familyId` ou `file` manquant
- **401** : Token JWT manquant ou invalide
- **403** : L'utilisateur n'est pas membre actif de la famille
- **413** : Fichier trop volumineux (> 100MB)
- **500** : Erreur serveur

**Notes :**
- Les fichiers sont sauvegardés dans `public/uploads/` avec un nom unique : `{timestamp}-{filename}`
- L'URL retournée (`urlPath`) est accessible directement : `http://localhost:3001/uploads/...`
- **Taille maximale : 100MB**
- Utilise formidable pour gérer les gros fichiers
- Pas de timeout strict (peut prendre plusieurs minutes pour les gros fichiers)

### `GET /api/family/[familyId]/media`
**Rôle :** Lister tous les médias d'une famille.
**URL :** Remplacer `[familyId]` par l'ID de la famille, ex: `/api/family/1/media`
**Query Params :**
- `type` (Optionnel) : Filtrer par type (`IMAGE`, `VIDEO`, `FILE`)
- `chatRoomId` (Optionnel) : Filtrer les médias partagés dans une room spécifique
**Réponse (200 OK) :**
```json
[
  {
    "id": 1,
    "urlPath": "...",
    "mediaType": "IMAGE",
    "uploader": { "displayName": "Jean" },
    "person": { "firstName": "Marie", "lastName": "Curie" } // Si lié à une personne
  }
]
```

---

## 📅 Événements Familiaux (Nouveau) ⭐

### `POST /api/event`
**Rôle :** Créer un nouvel événement familial.
**Body :**
```json
{
  "familyId": 1,
  "title": "Réunion de Noël 2024",
  "eventDate": "2024-12-25", // Optionnel
  "location": "Marseille, France" // Optionnel
}
```
**Réponse (201 Created) :** Objet `FamilyEvent` créé.

### `GET /api/family/[familyId]/events`
**Rôle :** Lister tous les événements d'une famille.
**Réponse (200 OK) :**
```json
[
  {
    "id": 1,
    "familyId": 1,
    "title": "Réunion de Noël 2024",
    "eventDate": "2024-12-25T00:00:00.000Z",
    "location": "Marseille",
    "_count": { "media": 15 } // Nombre de photos/vidéos liées
  }
]
```

### `GET /api/event/[id]`
**Rôle :** Obtenir les détails d'un événement précis et tous les médias (photos/vidéos) qui lui sont liés.
**Réponse (200 OK) :**
```json
{
  "id": 1,
  "title": "Réunion de Noël 2024",
  "media": [
    { "id": 5, "urlPath": "/uploads/...", "mediaType": "IMAGE", "uploader": { "displayName": "Jean" } }
  ]
}
```

### `PATCH /api/event/[id]`
**Rôle :** Modifier un événement (Titre, Date, Lieu).
**Body :**
```json
{
  "title": "Réunion de Noël (Modifié)",
  "location": "Marseille (Chez Mamie)"
}
```

### `DELETE /api/event/[id]`
**Rôle :** Supprimer un événement.
**Réponse (200 OK) :** `{ "success": true }`

---

---

## Chat

### `POST /api/chat/message`
**Rôle :** Envoyer un message dans une chat room. Supporte le texte, les médias (images, vidéos, fichiers), ou les deux.
**Pré-requis :** Si on envoie des médias, ils doivent d'abord être uploadés via `/api/media/upload` pour obtenir leurs IDs.
**Body :**
```json
{
  "chatRoomId": 1,
  "content": "Bonjour la famille ! Voici des photos.", // Optionnel si attachments présent
  "attachmentIds": [1, 2, 3] // Optionnel, liste des IDs de médias préalablement uploadés
}
```
**Réponse (201 Created) :**
Objet `Message` créé, incluant les attachements (tableau `attachments`).

### `GET /api/chat/messages?chatRoomId=...`
**Rôle :** Récupérer l'historique des messages d'une salle.
**Query Params :** `chatRoomId`
**Réponse (200 OK) :**
```json
[
  {
    "id": 1,
    "content": "Bonjour la famille !",
    "sentAt": "...",
    "sender": {
      "id": 1,
      "displayName": "Jean",
      "email": "..."
    },
    "attachments": [
       {
         "id": 5,
         "urlPath": "...",
         "mediaType": "IMAGE"
       }
    ]
  }
]
```

### `GET /api/chat/rooms?familyId=...`
**Rôle :**  Lister les salons de discussion visibles pour l'utilisateur dans une famille (Publics + Privés dont il est membre).
**Query Params :** `familyId`
**Réponse (200 OK) :**
```json
[
  {
    "id": 1,
    "name": "Général",
    "channelType": "PUBLIC",
    "_count": { "messages": 12 },
    "participants": [...]
  },
  {
    "id": 2,
    "name": "Secret",
    "channelType": "PRIVATE",
    "_count": { "messages": 5 }
  }
]
```

### `POST /api/chat/rooms`
**Rôle :** Créer un nouveau salon de discussion.
**Body :**
```json
{
  "familyId": 1,
  "name": "Projet Vacances",
  "description": "Discussion pour l'été 2024", // Optionnel
  "avatarUrl": "https://...", // Optionnel
  "isPrivate": true, // Optionnel (défaut: false)
  "participantIds": [2, 3, 4] // Optionnel, IDs des utilisateurs membres à inclure dès le début
}
```
**Réponse (201 Created) :** Objet `ChatRoom` avec `participants`.

### `PUT /api/chat/rooms`
**Rôle :** Mettre à jour un salon (Nom, Description, Avatar, Visibilité). Réservé au créateur (ADMIN du salon).
**Body :**
```json
{
  "chatRoomId": 10,
  "name": "Nouveau Nom",
  "description": "Nouvelle description",
  "avatarUrl": "...",
  "channelType": "PRIVATE" // ou "PUBLIC"
}
```

### `POST /api/chat/rooms/participants`
**Rôle :** Ajouter un membre à un salon privé existant. Réservé à l'ADMIN du salon.
**Body :**
```json
{
  "chatRoomId": 10,
  "userIdToAdd": 5
}
```

### `DELETE /api/chat/rooms/participants`
**Rôle :** Retirer un membre d'un salon. Réservé à l'ADMIN du salon.
**Body :**
```json
{
  "chatRoomId": 10,
  "userIdToRemove": 5
}
```
