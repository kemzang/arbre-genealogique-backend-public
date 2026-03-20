# 🌳 Arbre Généalogique - Documentation API

**Base URL** : `https://arbre-genealogique-backend-public.vercel.app`

Tous les IDs sont des **UUID** (chaînes de caractères).  
Toutes les suppressions sont des **soft delete** (champ `deletedAt` ou `leftAt`).  
Les réponses d'erreur suivent le format : `{ "error": "message" }`.

---

## 📋 Flux de fonctionnement

```
1. INSCRIPTION     → POST /api/users
2. CONNEXION       → POST /api/users/login  (reçoit un JWT token)
3. CHOIX           → Créer une famille OU Rejoindre une famille existante
   a. Créer        → POST /api/family  (devient ADMIN + Person auto-créée dans l'arbre)
   b. Rechercher   → GET  /api/family/search?name=xxx
   c. Rejoindre    → POST /api/family/join  (statut PENDING, nécessite 3 votes APPROVE)
4. VALIDATION      → Les membres ACTIVE votent pour les PENDING → POST /api/member/validate
5. ARBRE           → Ajouter des personnes → POST /api/person
6. RELATIONS       → Lier les personnes → POST /api/relationship
7. ÉVÉNEMENTS      → Créer des événements familiaux → POST /api/event
8. CHAT            → Discuter dans les salons → POST /api/chat/message
9. MÉDIAS          → Uploader photos/vidéos → POST /api/media/upload
10. FUSION         → Connecter deux familles → POST /api/family/fusion-request
```

---

## 🔐 Authentification

Toutes les routes (sauf inscription, connexion, recherche famille, forgot/reset password) nécessitent :

```
Authorization: Bearer <token_jwt>
```

---

## 1. Utilisateurs (Auth)

### POST /api/users — Inscription

```json
// Request Body
{
  "email": "user@example.com",
  "password": "motdepasse",
  "name": "Jean Dupont",
  "profilePictureUrl": "https://..." // OBLIGATOIRE
}

// Response 201
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Jean Dupont",
  "profilePictureUrl": "https://...",
  "isSuperAdmin": false,
  "createdAt": "2026-03-18T...",
  "updatedAt": "2026-03-18T..."
}
```

Erreurs : `400` (champs manquants), `409` (email déjà utilisé)

### POST /api/users/login — Connexion

```json
// Request Body
{
  "email": "user@example.com",
  "password": "motdepasse"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Jean Dupont",
    "profilePictureUrl": "https://...",
    "isSuperAdmin": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Erreurs : `400` (champs manquants), `401` (identifiants invalides)

### GET /api/users/profile — Profil utilisateur connecté

```
Authorization: Bearer <token>
```

```json
// Response 200
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Jean Dupont",
  "profilePictureUrl": "https://...",
  "createdAt": "...",
  "isSuperAdmin": false
}
```

### PATCH /api/users/profile — Modifier le profil

```json
// Request Body (tous les champs sont optionnels)
{
  "displayName": "Nouveau Nom",
  "profilePictureUrl": "https://nouvelle-url...",
  "currentPassword": "ancien",      // requis si newPassword
  "newPassword": "nouveau_mdp"
}

// Response 200 — même format que GET /api/users/profile
```

### GET /api/users/profile/stats — Statistiques du profil

```json
// Response 200
{
  "familyMembers": 12,
  "eventsCreated": 5,
  "messagesSent": 48,
  "chatRoomsJoined": 3
}
```

### POST /api/users/forgot-password — Demande de réinitialisation

```json
// Request Body
{ "email": "user@example.com" }

// Response 200 (toujours, pour ne pas révéler si l'email existe)
{ "message": "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." }
```

### POST /api/users/reset-password — Réinitialiser le mot de passe

```json
// Request Body
{
  "token": "hex_token_reçu_par_email",
  "password": "nouveau_mot_de_passe"  // min 8 caractères
}

// Response 200
{ "message": "Mot de passe mis à jour avec succès" }
```

---

## 2. Famille

### POST /api/family — Créer une famille

L'utilisateur devient automatiquement ADMIN + ACTIVE. Une Person liée est créée dans l'arbre. Deux salons de chat sont créés automatiquement ("Général" et "Famille {nom}").

```json
// Request Body
{ "familyName": "Dupont" }

// Response 201
{
  "id": "uuid",
  "familyName": "Dupont",
  "logoUrl": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET /api/family/search?name=xxx — Rechercher une famille

Paramètre query : `name` ou `q`  
Pas besoin d'être authentifié (mais si authentifié, ajoute `isMember`).

```json
// Response 200
[
  {
    "id": "uuid",
    "familyName": "Dupont",
    "logoUrl": null,
    "createdAt": "...",
    "updatedAt": "...",
    "isMember": true  // si authentifié
  }
]
```

### POST /api/family/join — Rejoindre une famille

Le membre est créé en statut PENDING. Il faut 3 votes APPROVE pour devenir ACTIVE.

```json
// Request Body
{
  "familyId": "uuid",
  "gender": "M",                    // optionnel
  "relatedToPersonId": "uuid",      // optionnel - personne à qui on est lié
  "relationshipType": "PARENTAL"    // optionnel - PARENTAL | UNION | SIBLING
}

// Response 201
{
  "id": "uuid",
  "userId": "uuid",
  "familyId": "uuid",
  "role": "VIEWER",
  "status": "PENDING",
  "joinedAt": "...",
  "updatedAt": "...",
  "applicationData": "{...}"
}
```

### GET /api/family/pending-members — Membres en attente

Retourne les membres PENDING de toutes les familles où l'utilisateur est ACTIVE.

```json
// Response 200
[
  {
    "id": "uuid",
    "familyId": "uuid",
    "userId": "uuid",
    "userEmail": "user@example.com",
    "userDisplayName": "Jean",
    "profilePictureUrl": "https://...",
    "joinedAt": "...",
    "applicationData": "{\"gender\":\"M\",\"relatedToPersonId\":\"uuid\",...}"
  }
]
```

### GET /api/family/[familyId]/events — Événements d'une famille

Filtre automatiquement selon la visibilité (PUBLIC, PRIVATE, RESTRICTED, BRANCH).

```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Anniversaire",
    "eventDate": "2026-06-15T...",
    "location": "Paris",
    "visibility": "PUBLIC",
    "creatorId": "uuid",
    "deletedAt": null,
    "creator": { "displayName": "Jean" },
    "guests": [...],
    "_count": { "media": 3 }
  }
]
```

### GET /api/family/[familyId]/media — Médias d'une famille

Query params optionnels : `type` (IMAGE|VIDEO|FILE), `chatRoomId`

```json
// Response 200
[
  {
    "id": "uuid",
    "familyId": "uuid",
    "uploaderId": "uuid",
    "urlPath": "https://res.cloudinary.com/...",
    "mediaType": "IMAGE",
    "uploader": { "displayName": "Jean" },
    "person": { "firstName": "Marie", "lastName": "Dupont" }
  }
]
```

---

## 3. Membres (Validation)

### GET /api/member/status — Statut de l'utilisateur dans ses familles

```json
// Response 200
[
  {
    "familyId": "uuid",
    "familyName": "Dupont",
    "status": "ACTIVE",    // PENDING | ACTIVE | REJECTED
    "role": "ADMIN"        // ADMIN | EDITOR | VIEWER
  }
]
```

### POST /api/member/validate — Voter pour un membre en attente

3 votes APPROVE = membre devient ACTIVE (et est ajouté aux salons PUBLIC automatiquement).

```json
// Request Body
{
  "targetMemberId": "uuid",
  "vote": "APPROVE"    // APPROVE | REJECT
}

// Response 200
{ "success": true }
```

Erreurs : `409` (déjà voté)

---

## 4. Personnes (Arbre)

### POST /api/person — Ajouter une personne à l'arbre

Requiert rôle ADMIN ou EDITOR dans la famille.

```json
// Request Body
{
  "familyId": "uuid",
  "firstName": "Marie",
  "lastName": "Dupont",
  "birthDate": "1990-05-15",
  "deathDate": null,
  "gender": "F",                    // M | F | O
  "bio": "Description...",
  "profilePictureUrl": "https://...",
  "linkedUserId": "uuid"            // optionnel - lier à un compte utilisateur
}

// Response 201
{
  "id": "uuid",
  "familyId": "uuid",
  "firstName": "Marie",
  "lastName": "Dupont",
  "birthDate": "1990-05-15T...",
  "deathDate": null,
  "gender": "F",
  "bio": "Description...",
  "profilePictureUrl": "https://...",
  "linkedUserId": "uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Si `linkedUserId` est fourni : le user est automatiquement ajouté comme membre ACTIVE (si créé par ADMIN/EDITOR) et ajouté aux salons PUBLIC.

### GET /api/person/[id] — Détail d'une personne

```json
// Response 200
{
  "person": { /* objet Person complet */ },
  "parents": [
    {
      "id": "uuid", "firstName": "Pierre", "lastName": "Dupont", "...",
      "relationshipInfo": {
        "id": "uuid", "status": "ACTIVE", "startDate": "...",
        "endDate": null, "endReason": null, "isBiological": true, "notes": null
      }
    }
  ],
  "children": [ /* même format */ ],
  "currentSpouses": [ /* conjoints actuels */ ],
  "formerSpouses": [ /* ex-conjoints */ ],
  "allSpouses": [ /* historique complet */ ],
  "siblings": [ /* frères et sœurs */ ],
  "relationshipHistory": {
    "totalMarriages": 2,
    "currentMarriages": 1,
    "divorces": 1,
    "widowed": 0
  }
}
```

### PATCH /api/person/[id] — Modifier une personne

Requiert rôle ADMIN ou EDITOR.

```json
// Request Body (tous optionnels)
{
  "firstName": "Marie",
  "lastName": "Martin",
  "birthDate": "1990-05-15",
  "deathDate": null,
  "gender": "F",
  "bio": "Nouvelle bio",
  "profilePictureUrl": "https://..."
}

// Response 200 — objet Person mis à jour
```

---

## 5. Relations

### Convention PARENTAL : personA = Parent, personB = Enfant

### POST /api/relationship — Créer une relation

Requiert rôle ADMIN ou EDITOR. Pour les relations inter-familles, les familles doivent être connectées (fusion approuvée).

```json
// Request Body
{
  "personAId": "uuid",
  "personBId": "uuid",
  "type": "PARENTAL",       // PARENTAL | UNION | SIBLING
  "isBiological": true,     // défaut: true
  "startDate": "2020-01-01", // optionnel
  "notes": "Adoption"       // optionnel
}

// Response 201
{
  "id": "uuid",
  "personAId": "uuid",
  "personBId": "uuid",
  "type": "PARENTAL",
  "isBiological": true,
  "status": "ACTIVE",
  "startDate": "2020-01-01T...",
  "endDate": null,
  "endReason": null,
  "notes": "Adoption",
  "deletedAt": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET /api/relationship/[id] — Détail d'une relation

Pour les UNION, retourne aussi les enfants communs.

```json
// Response 200
{
  "relationship": { /* objet Relationship avec personA et personB */ },
  "children": [ /* enfants communs (pour UNION) */ ]
}
```

### PATCH /api/relationship/[id] — Modifier une relation

```json
// Request Body
{
  "type": "UNION",
  "isBiological": false
}
```

### PATCH /api/relationship/[id]/end — Terminer une relation

```json
// Request Body
{
  "endReason": "Divorce",    // OBLIGATOIRE
  "endDate": "2025-06-01",   // optionnel (défaut: maintenant)
  "notes": "Séparation à l'amiable"
}

// Response 200
{
  "id": "uuid",
  "status": "ENDED",         // ou "DECEASED" si endReason contient "décès"/"death"
  "endDate": "2025-06-01T...",
  "endReason": "Divorce",
  "personA": { "firstName": "...", "lastName": "..." },
  "personB": { "firstName": "...", "lastName": "..." }
}
```

### DELETE /api/relationship/[id] — Supprimer une relation (soft delete)

```json
// Response 200
{ "success": true, "message": "Relationship deleted successfully" }
```

### GET /api/relationship/history — Historique des relations

Query params : `familyId` ou `personId` (au moins un requis)

```json
// Response 200
{
  "relationships": [ /* toutes les relations */ ],
  "activeRelationships": [ /* status ACTIVE */ ],
  "endedRelationships": [ /* status ENDED */ ],
  "deceasedRelationships": [ /* status DECEASED */ ],
  "stats": {
    "total": 15,
    "active": 10,
    "ended": 3,
    "deceased": 2,
    "byType": { "unions": 5, "parental": 8, "siblings": 2 }
  }
}
```

---

## 6. Arbre Généalogique

### GET /api/tree?familyId=uuid — Récupérer l'arbre complet

Si `familyId` omis, utilise la première famille ACTIVE de l'utilisateur. Inclut les familles connectées (fusion).

```json
// Response 200
{
  "persons": [ /* toutes les personnes */ ],
  "relationships": [ /* toutes les relations actives (deletedAt: null) */ ],
  "primaryFamilyId": "uuid",
  "connectedFamiliesCount": 1
}
```

---

## 7. Événements

### POST /api/event — Créer un événement

```json
// Request Body
{
  "familyIds": ["uuid1", "uuid2"],   // au moins 1 requis
  "title": "Anniversaire de Marie",  // OBLIGATOIRE
  "eventDate": "2026-06-15",
  "location": "Paris",
  "visibility": "PUBLIC",            // PUBLIC | PRIVATE | RESTRICTED | BRANCH
  "guestPersonIds": ["uuid"],        // pour RESTRICTED uniquement
  "targetPersonId": "uuid"           // pour BRANCH uniquement
}

// Response 201
{
  "id": "uuid",
  "title": "Anniversaire de Marie",
  "eventDate": "2026-06-15T...",
  "location": "Paris",
  "visibility": "PUBLIC",
  "creatorId": "uuid",
  "deletedAt": null,
  "guests": [...],
  "sharedFamilies": [...]
}
```

Visibilités :
- `PUBLIC` : visible par tous les membres de la famille
- `PRIVATE` : visible uniquement par le créateur
- `RESTRICTED` : visible par le créateur + les invités (guestPersonIds)
- `BRANCH` : visible par les personnes de la même branche que targetPersonId

### GET /api/event/[id] — Détail d'un événement

```json
// Response 200
{
  "id": "uuid",
  "title": "...",
  "eventDate": "...",
  "location": "...",
  "visibility": "PUBLIC",
  "creatorId": "uuid",
  "creator": { "displayName": "Jean", "profilePictureUrl": "..." },
  "media": [...],
  "guests": [...],
  "sharedFamilies": [...]
}
```

### PATCH /api/event/[id] — Modifier un événement (créateur uniquement)

```json
// Request Body (tous optionnels)
{
  "title": "Nouveau titre",
  "eventDate": "2026-07-01",
  "location": "Lyon",
  "visibility": "RESTRICTED",
  "guestPersonIds": ["uuid1", "uuid2"],
  "familyIds": ["uuid"]
}
```

### DELETE /api/event/[id] — Supprimer un événement (soft delete, créateur uniquement)

```json
// Response 200
{ "success": true, "message": "Event deleted successfully" }
```

---

## 8. Chat

### GET /api/chat/rooms?familyId=uuid — Lister les salons

Retourne uniquement les salons où l'utilisateur est participant actif (`leftAt: null`).

```json
// Response 200
[
  {
    "id": "uuid",
    "familyId": "uuid",
    "name": "Général",
    "description": "...",
    "avatarUrl": null,
    "channelType": "PUBLIC",
    "creatorId": "uuid",
    "createdAt": "...",
    "updatedAt": "...",
    "_count": { "messages": 42 },
    "participants": [
      { "id": "uuid", "userId": "uuid", "role": "ADMIN", "joinedAt": "...", "leftAt": null,
        "user": { "id": "uuid", "displayName": "Jean" } }
    ]
  }
]
```

### POST /api/chat/rooms — Créer un salon

```json
// Request Body
{
  "familyId": "uuid",
  "name": "Réunion famille",
  "description": "Salon pour organiser la réunion",
  "avatarUrl": "https://...",
  "isPrivate": false,
  "participantIds": ["uuid1", "uuid2"]  // optionnel
}

// Response 201 — objet ChatRoom avec participants
```

### PUT /api/chat/rooms — Modifier un salon (admin du salon uniquement)

```json
// Request Body
{
  "chatRoomId": "uuid",
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "avatarUrl": "https://...",
  "channelType": "PRIVATE"   // PUBLIC | PRIVATE
}
```

### GET /api/chat/rooms/[id] — Détail d'un salon

```json
// Response 200
{
  "id": "uuid",
  "name": "Général",
  "description": "...",
  "channelType": "PUBLIC",
  "creatorId": "uuid",
  "_count": { "messages": 42 },
  "participants": [
    {
      "id": "uuid", "chatRoomId": "uuid", "userId": "uuid",
      "role": "ADMIN", "joinedAt": "...", "leftAt": null,
      "user": { "id": "uuid", "displayName": "Jean", "email": "...", "profilePictureUrl": "..." }
    }
  ],
  "creator": { "id": "uuid", "displayName": "Jean", "profilePictureUrl": "..." }
}
```

### POST /api/chat/rooms/leave — Quitter un salon

```json
// Request Body
{ "chatRoomId": "uuid" }

// Response 200
{ "success": true, "message": "Vous avez quitté le salon avec succès." }
```

Erreurs possibles (avec `reason` pour le frontend) :
- `400` + `reason: "MISSING_PARAMETER"` — chatRoomId manquant
- `400` + `reason: "ALREADY_LEFT"` — déjà quitté
- `403` + `reason: "NOT_PARTICIPANT"` — pas membre du salon
- `403` + `reason: "LAST_ADMIN"` — dernier admin, doit promouvoir quelqu'un d'abord
- `404` + `reason: "ROOM_NOT_FOUND"` — salon introuvable

### GET /api/chat/rooms/participants?chatRoomId=uuid — Participants actifs

```json
// Response 200
[
  {
    "id": "uuid",
    "chatRoomId": "uuid",
    "userId": "uuid",
    "role": "ADMIN",
    "joinedAt": "...",
    "leftAt": null,
    "user": { "id": "uuid", "displayName": "Jean", "email": "...", "profilePictureUrl": "..." }
  }
]
```

### POST /api/chat/rooms/participants — Ajouter un participant (admin salon)

```json
// Request Body
{ "chatRoomId": "uuid", "userIdToAdd": "uuid" }
```

### DELETE /api/chat/rooms/participants — Retirer un participant (admin salon, soft delete)

```json
// Request Body
{ "chatRoomId": "uuid", "userIdToRemove": "uuid" }

// Response 200
{ "success": true, "message": "Participant removed successfully" }
```

### POST /api/chat/message — Envoyer un message

```json
// Request Body
{
  "chatRoomId": "uuid",
  "content": "Bonjour tout le monde !",
  "attachmentIds": ["uuid"]   // optionnel - IDs de médias déjà uploadés
}

// Response 201
{
  "id": "uuid",
  "chatRoomId": "uuid",
  "senderId": "uuid",
  "content": "Bonjour tout le monde !",
  "sentAt": "...",
  "updatedAt": "...",
  "attachments": [...]
}
```

### GET /api/chat/messages?chatRoomId=uuid — Messages d'un salon

Retourne les 500 derniers messages triés par date croissante.

```json
// Response 200
[
  {
    "id": "uuid",
    "chatRoomId": "uuid",
    "senderId": "uuid",
    "content": "Bonjour !",
    "sentAt": "...",
    "sender": { /* objet User */ },
    "attachments": [...]
  }
]
```

---

## 9. Médias

### POST /api/media/upload — Uploader un fichier

Envoi en **multipart/form-data** (pas JSON).

```
Content-Type: multipart/form-data

file: <fichier binaire>          // OBLIGATOIRE
familyId: "uuid"                 // OBLIGATOIRE
personId: "uuid"                 // optionnel
eventId: "uuid"                  // optionnel
mediaType: "IMAGE"               // IMAGE | VIDEO | FILE (défaut: IMAGE)
```

```json
// Response 201
{
  "id": "uuid",
  "familyId": "uuid",
  "uploaderId": "uuid",
  "personId": null,
  "eventId": null,
  "messageId": null,
  "urlPath": "https://res.cloudinary.com/...",
  "mediaType": "IMAGE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 10. Fusion de familles

### POST /api/family/fusion-request — Demander une fusion

Réservé aux ADMIN de la famille source.

```json
// Request Body
{
  "sourceFamilyId": "uuid",
  "targetFamilyId": "uuid",
  "sourcePersonId": "uuid",       // personne de la famille source
  "targetPersonId": "uuid",       // personne de la famille cible
  "relationshipType": "UNION",    // PARENTAL | UNION | SIBLING
  "justification": "Mariage entre Marie et Pierre"
}

// Response 201
{
  "id": "uuid",
  "sourceFamilyId": "uuid",
  "targetFamilyId": "uuid",
  "sourcePersonId": "uuid",
  "targetPersonId": "uuid",
  "relationshipType": "UNION",
  "justification": "...",
  "status": "PENDING",
  "sourceFamily": { "familyName": "Dupont" },
  "targetFamily": { "familyName": "Martin" },
  "sourcePerson": { "firstName": "Marie", "lastName": "Dupont" },
  "targetPerson": { "firstName": "Pierre", "lastName": "Martin" },
  "requester": { "displayName": "Jean" }
}
```

### GET /api/family/fusion-request — Lister les demandes de fusion

Retourne toutes les demandes liées aux familles de l'utilisateur.

### POST /api/family/validate-cross-relationship — Valider/Rejeter une fusion

Réservé aux ADMIN de la famille cible.

```json
// Request Body
{
  "requestId": "uuid",
  "action": "APPROVE"    // APPROVE | REJECT
}

// Response 200 (si APPROVE)
{
  "updatedRequest": { "status": "APPROVED", "..." },
  "connection": { /* FamilyConnection créée */ },
  "relationship": { /* Relationship créée entre les 2 personnes */ },
  "message": "Families connected through UNION relationship between Marie and Pierre"
}
```

---

## 📊 Enums de référence

| Enum | Valeurs |
|------|---------|
| Gender | `M`, `F`, `O` |
| Role (membre famille) | `ADMIN`, `EDITOR`, `VIEWER` |
| MemberStatus | `PENDING`, `ACTIVE`, `REJECTED` |
| RelationshipType | `PARENTAL`, `UNION`, `SIBLING` |
| RelationshipStatus | `ACTIVE`, `ENDED`, `DECEASED` |
| EventVisibility | `PUBLIC`, `PRIVATE`, `RESTRICTED`, `BRANCH` |
| MediaType | `IMAGE`, `VIDEO`, `FILE` |
| ChannelType | `PUBLIC`, `PRIVATE` |
| ChatRole | `ADMIN`, `MEMBER` |
| VoteType | `APPROVE`, `REJECT` |
| RequestStatus | `PENDING`, `APPROVED`, `REJECTED` |

---

## ⚠️ Notes importantes

- **PARENTAL** : `personA` = Parent, `personB` = Enfant (l'ordre compte)
- **Soft delete** : Les événements, relations et participations chat ne sont jamais supprimés physiquement
- **Validation membre** : 3 votes APPROVE nécessaires pour passer de PENDING à ACTIVE
- **Création famille** : Crée automatiquement 2 salons chat + 1 Person liée au créateur
- **Fusion** : Seul un ADMIN de la famille source peut demander, seul un ADMIN de la famille cible peut valider
- **Arbre** : Inclut automatiquement les personnes des familles connectées (fusion approuvée)
