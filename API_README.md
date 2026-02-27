# Documentation API Backend

Ce document liste les **endpoints réellement implémentés** dans `app/api` (et `pages/api` pour certains uploads), avec leur rôle, les corps attendus et la forme générale des réponses.  
Tous les endpoints sont **base URL = `http://localhost:3001`** en dev.

---

## 1. Authentification & Utilisateurs

### 1.1 `POST /api/users` — Créer un compte

- **Body (JSON)** :

```json
{
  "email": "user@example.com",
  "password": "monMotDePasse",
  "name": "Jean Dupont",
  "profilePictureUrl": "https://exemple.com/photo.jpg"
}
```

- **Réponse (201)** : objet `User` sans `passwordHash` :

```json
{
  "id": 1,
  "email": "user@example.com",
  "displayName": "Jean Dupont",
  "profilePictureUrl": "https://exemple.com/photo.jpg",
  "isSuperAdmin": false,
  "createdAt": "2026-02-26T10:00:00.000Z"
}
```

### 1.2 `POST /api/users/login` — Connexion

- **Body (JSON)** :

```json
{
  "email": "user@example.com",
  "password": "monMotDePasse"
}
```

- **Réponse (200)** :

```json
{
  "token": "JWT_TOKEN_ICI",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Jean Dupont",
    "profilePictureUrl": "https://exemple.com/photo.jpg",
    "isSuperAdmin": false,
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

- **Erreurs** :
  - `400` : email ou mot de passe manquant.
  - `401` : identifiants invalides.

### 1.3 `POST /api/users/forgot-password` — Demande de réinitialisation

- **Body (JSON)** :

```json
{ "email": "user@example.com" }
```

- **Comportement** :
  - Cherche un utilisateur avec cet email.
  - Crée un enregistrement `PasswordResetToken` valable 1h.
  - Retourne toujours un message générique (ne révèle pas si l’email existe).

- **Réponse (200)** :

```json
{
  "message": "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
  "resetToken": "TOKEN_DEV_OPTIONNEL"
}
```

> En dev, `resetToken` est renvoyé pour permettre au frontend de tester le flux sans email.

### 1.4 `POST /api/users/reset-password` — Réinitialiser le mot de passe

- **Body (JSON)** :

```json
{
  "token": "TOKEN_DE_RESET_RECU",
  "password": "nouveauMotDePasse"
}
```

- **Règles** :
  - `password` ≥ 8 caractères.
  - `token` doit exister, ne pas être expiré, et ne pas avoir déjà été utilisé.

- **Réponse (200)** :

```json
{ "message": "Mot de passe mis à jour avec succès" }
```

- **Erreurs** :
  - `400` : token manquant / invalide / expiré, ou mot de passe trop court.
  - `500` : erreur interne.

---

## 2. Familles & Membres

**Authentification :** tous ces endpoints (sauf `GET /api/family/search`) nécessitent un header :

```http
Authorization: Bearer <JWT>
```

Les droits reposent sur le modèle `Member` (`role`: `ADMIN` / `EDITOR` / `VIEWER`, `status`: `PENDING` / `ACTIVE` / `REJECTED`).  

### 2.1 `POST /api/family` — Créer une famille

- **Body (JSON)** :

```json
{ "familyName": "Famille Dupont" }
```

- **Comportement** :
  - Crée une famille.
  - Crée deux salons publics : `"Général"` et `"Famille <Nom>"`.
  - Ajoute le créateur :
    - comme **ADMIN ACTIVE** (`Member`),
    - ADMIN dans les deux salons (`ChatRoomParticipant`).

- **Réponse (201)** : objet `Family`.

### 2.2 `POST /api/family/join` — Demander à rejoindre une famille

- **Body (JSON)** typique :

```json
{
  "familyId": 1,
  "gender": "M",
  "relatedToPersonId": 12,
  "relationshipType": "PARENTAL"
}
```

- **Comportement** :
  - Vérifie que la famille existe (sinon `404`).
  - Empêche les doublons (demande existante ou déjà membre → `409`).
  - Crée un `Member` avec :
    - `role = "VIEWER"`
    - `status = "PENDING"`
    - `applicationData` JSON (genre, personne liée, type de lien).

- **Réponse (201)** : objet `Member` créé.

### 2.3 `GET /api/family/pending-members` — Demandes en attente

Retourne toutes les demandes PENDING pour les familles où l’utilisateur est **ACTIVE**.

- **Réponse (200)** :

```json
[
  {
    "id": 10,
    "familyId": 1,
    "userId": 5,
    "userEmail": "demandeur@example.com",
    "userDisplayName": "Jean",
    "profilePictureUrl": "https://...",
    "joinedAt": "2026-02-26T10:00:00.000Z",
    "applicationData": "{ ... }"
  }
]
```

### 2.4 `GET /api/member/status` — Statut de l’utilisateur dans chaque famille

- **Réponse (200)** :

```json
[
  {
    "familyId": 1,
    "familyName": "Famille Dupont",
    "status": "ACTIVE",
    "role": "ADMIN"
  }
]
```

### 2.5 `POST /api/member/validate` — Voter pour un nouveau membre

- **Body (JSON)** :

```json
{
  "targetMemberId": 10,
  "vote": "APPROVE"   // ou "REJECT"
}
```

- **Règles** :
  - Votant doit être **ACTIVE** dans la même famille.
  - Chaque utilisateur ne peut voter qu’une fois par membre (`P2002` géré → `409`).
  - À partir de **3 votes APPROVE**, le membre passe automatiquement en `ACTIVE` et est ajouté aux salons publics.

- **Réponse (200)** :

```json
{ "success": true }
```

### 2.6 `GET /api/family/search` — Rechercher des familles

Accessible sans être connecté.

- **Query** : `?name=dupont` ou `?q=dupont`
- **Réponse (200)** :

```json
[
  {
    "id": 1,
    "familyName": "Famille Dupont",
    "logoUrl": null,
    "createdAt": "2026-02-26T10:00:00.000Z",
    "isMember": true   // uniquement si utilisateur connecté
  }
]
```

---

## 3. Arbre généalogique & Personnes

### 3.1 `GET /api/tree` — Charger l’arbre

- **Query** :
  - sans paramètre : prend la première famille où l’utilisateur est **ACTIVE**.
  - avec `familyId` : charge cette famille + les familles **connectées** (via `FamilyConnection`).

- **Sécurité** :
  - Auth obligatoire.
  - L’utilisateur doit être **ACTIVE dans au moins une des familles** du réseau (famille principale ou connectée), sinon `403`.

- **Réponse (200)** :

```json
{
  "persons": [ /* personnes de toutes les familles concernées */ ],
  "relationships": [ /* relations entre ces personnes */ ],
  "primaryFamilyId": 1,
  "connectedFamiliesCount": 2
}
```

### 3.2 `POST /api/person` — Créer une personne

- **Body (JSON)** :

```json
{
  "familyId": 1,
  "firstName": "Marie",
  "lastName": "Curie",
  "birthDate": "1867-11-07",
  "deathDate": null,
  "gender": "F",
  "bio": "Scientifique",
  "profilePictureUrl": "https://...",
  "linkedUserId": 5    // optionnel
}
```

- **Sécurité** :
  - Utilisateur doit être **ACTIVE** dans `familyId`.
  - Et avoir le rôle **ADMIN ou EDITOR** (un VIEWER reçoit `403`).

- **Comportement spécial `linkedUserId`** :
  - Crée ou met à jour un `Member` pour l’utilisateur lié.
  - Si le créateur est ADMIN/EDITOR → ce membre devient `ACTIVE`, sinon `PENDING`.
  - L’utilisateur lié est ajouté aux salons publics **seulement s’il est ACTIVE**.
  - La photo de profil de l’utilisateur lié est recopiée sur la personne si elle est absente.

### 3.3 `GET /api/person/[id]` — Détails riches d’une personne

Retourne la personne, ses parents, enfants, conjoints (actuels et anciens), fratrie, historique des relations, etc.  
L’utilisateur doit être **ACTIVE** dans la famille de cette personne.

- **Réponse (200)** : structure riche (voir code pour le détail).

### 3.4 `POST /api/relationship` — Créer une relation

- **Body (JSON)** :

```json
{
  "personAId": 10,
  "personBId": 12,
  "type": "PARENTAL",       // "PARENTAL" | "UNION" | "SIBLING"
  "isBiological": true,
  "startDate": "2024-06-15",
  "notes": "Mariage célébré à Paris"
}
```

- **Règles** :
  - Personnes doivent exister.
  - Si elles sont de familles différentes, une `FamilyConnection` doit exister (via le workflow de fusion).
  - L’utilisateur doit être **ACTIVE** dans au moins une des familles impliquées **et** avoir rôle **ADMIN ou EDITOR**.

- **Réponse (201)** : objet `Relationship` créé.

### 3.5 `PATCH /api/relationship/[id]/end` — Terminer une relation

Permet de marquer une relation comme terminée (divorce, décès, etc.) sans la supprimer.

### 3.6 `GET /api/relationship/history` — Historique des relations

Permet de récupérer l’historique complet des relations pour une personne ou une famille, avec des stats agrégées.  
L’utilisateur doit être **ACTIVE** dans la famille ciblée.

---

## 4. Fusion de familles & Connexions

### 4.1 `POST /api/family/fusion-request` — Demande de fusion

- **Body (JSON)** :

```json
{
  "sourceFamilyId": 1,
  "targetFamilyId": 2,
  "sourcePersonId": 10,
  "targetPersonId": 15,
  "relationshipType": "UNION",     // "PARENTAL" | "UNION" | "SIBLING"
  "justification": "Mariage entre Jean et Marie"
}
```

- **Règles** :
  - L’utilisateur doit être **ADMIN ACTIVE** de la famille source.
  - Les personnes doivent appartenir à leurs familles respectives.
  - Pas de relation existante ni de demande PENDING pour la même paire de personnes.

### 4.2 `POST /api/family/validate-cross-relationship` — Valider ou rejeter

- **Body (JSON)** :

```json
{
  "requestId": 123,
  "action": "APPROVE"   // ou "REJECT"
}
```

- **Règles** :
  - L’utilisateur doit être **ADMIN ACTIVE** de la famille cible.
  - En cas d’`APPROVE`, une transaction :
    - met à jour la demande (`APPROVED`),
    - crée/assure une `FamilyConnection`,
    - crée une `Relationship` concrète entre les deux personnes.

---

## 5. Événements familiaux

### 5.1 `POST /api/event` — Créer un événement

- **Body (JSON)** :

```json
{
  "familyIds": [1, 2],
  "title": "Réunion de Noël 2024",
  "eventDate": "2024-12-25",
  "location": "Marseille",
  "visibility": "PUBLIC",        // "PUBLIC" | "PRIVATE" | "RESTRICTED" | "BRANCH"
  "targetPersonId": 10,          // requis si visibility = "BRANCH"
  "guestPersonIds": [10, 15]     // requis si visibility = "RESTRICTED"
}
```

- **Règles** :
  - L’utilisateur doit être **ACTIVE** dans **toutes** les familles de `familyIds`.

### 5.2 `GET /api/family/[familyId]/events` — Lister les événements d’une famille

Liste les événements accessibles pour l’utilisateur dans cette famille (avec filtrage selon la visibilité et les branches).

### 5.3 `GET /api/event/[id]` — Détails d’un événement

Retourne l’événement + médias associés, si l’utilisateur y a accès.

---

## 6. Médias

### 6.1 `POST /api/media/upload` — Upload ≤ 10MB

- **Headers** :
  - `Authorization: Bearer <JWT>`
  - **Ne pas** fixer `Content-Type` (géré par le navigateur).

- **Body (FormData)** :
  - `file` (File) — obligatoire
  - `familyId` (string/number) — obligatoire
  - `mediaType` — `"IMAGE" | "VIDEO" | "FILE"` (défaut: `"IMAGE"`)
  - `personId` (optionnel)
  - `eventId` (optionnel)

- **Réponse (201)** : objet `Media`.

### 6.2 `POST /api/media/upload-large` — Upload gros fichiers (pages/api)

Même logique que ci-dessus, mais pour des fichiers plus volumineux (endpoint `pages/api/media/upload-large.ts`).

### 6.3 `GET /api/family/[familyId]/media` — Lister les médias d’une famille

- **Query** :
  - `type` (optionnel) : `IMAGE` / `VIDEO` / `FILE`
  - `chatRoomId` (optionnel) : filtre par salon.

- **Réponse (200)** : liste de médias avec uploader et personne liée.

---

## 7. Chat

### 7.1 `GET /api/chat/rooms?familyId=...` — Salons visibles

Retourne les salons publics + privés où l’utilisateur est participant, pour une famille donnée (et où il est ACTIVE).

### 7.2 `POST /api/chat/rooms` — Créer un salon

Crée un salon (PUBLIC ou PRIVATE) dans une famille, avec participants initiaux. L’utilisateur doit être **ACTIVE** dans la famille (généralement ADMIN pour les salons importants).

### 7.3 `PUT /api/chat/rooms` — Mettre à jour un salon

Réservé à l’ADMIN du salon.

### 7.4 `POST /api/chat/rooms/participants` / `DELETE /api/chat/rooms/participants`

Ajouter / retirer un participant d’un salon privé, réservé à l’ADMIN du salon.

### 7.5 `POST /api/chat/message` — Envoyer un message

- **Body (JSON)** :

```json
{
  "chatRoomId": 1,
  "content": "Bonjour la famille !",
  "attachmentIds": [1, 2]   // IDs de médias déjà uploadés
}
```

### 7.6 `GET /api/chat/messages?chatRoomId=...` — Historique des messages

Retourne jusqu’à 500 messages, avec sender + attachments.  
L’utilisateur doit être **ACTIVE** dans la famille du salon (après correction).

---

## 8. Administration (Super-Admin)

Tous ces endpoints sont protégés par le middleware Super-Admin (voir `lib/auth.ts` + routes `app/api/admin/**`).

- `GET /api/admin/stats` — statistiques globales.
- `GET /api/admin/stats/timeline` — évolution temporelle.
- `GET /api/admin/stats/distribution` — répartition par rôles, tailles de familles, etc.
- `GET /api/admin/stats/engagement` — métriques d’engagement.
- `GET /api/admin/stats/system` — santé technique.
- `GET /api/admin/activity` — activité récente.
- `GET /api/admin/users` / `GET|PATCH|DELETE /api/admin/users/[id]` — gestion des utilisateurs.
- `GET /api/admin/families` / `GET|DELETE /api/admin/families/[id]` — gestion des familles.
- `POST /api/admin/bootstrap` — initialisation sécurisée du premier Super-Admin (utilisé au seed).

---

## 9. Rappel pour le Frontend

- Toujours envoyer : `Authorization: Bearer <token>` pour les endpoints protégés.
- Les statuts et rôles importants :
  - `Member.status` : `PENDING` / `ACTIVE` / `REJECTED`
  - `Member.role` : `ADMIN` / `EDITOR` / `VIEWER`
  - `Relationship.type` : `PARENTAL` / `UNION` / `SIBLING`
  - `Relationship.status` : `ACTIVE` / `ENDED` / `DECEASED`

Utilise ce fichier comme **référence centrale** pour brancher le frontend ; pour les détails très fins (tous les champs retournés), réfère-toi directement au code des routes dans `app/api` si besoin.

