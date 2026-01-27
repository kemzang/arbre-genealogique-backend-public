# Documentation API Backend

Ce document recense tous les endpoints disponibles dans le backend, leur rôle, le format du corps de la requête (body) attendu et le format de la réponse.

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
**Rôle :** Créer une nouvelle famille. L'utilisateur courant devient ADMIN et membre ACTIF.
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
**Query Params :** `name` (partie du nom de famille)
**Réponse (200 OK) :**
Liste des familles correspondantes. Si l'utilisateur est connecté, un champ `isMember` est ajouté.
```json
[
  {
    "id": 1,
    "familyName": "Famille Dupont",
    "createdAt": "...",
    "updatedAt": "...",
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
    "joinedAt": "..."
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

---

## Média

### `POST /api/media/upload`
**Rôle :** Enregistrer les métadonnées d'un média uploadé (l'upload fichier se fait généralement avant vers un storage type S3/Cloudinary, ici on sauve l'URL).
**Body :**
```json
{
  "familyId": 1,
  "personId": 5, // Optionnel, pour lier à une personne spécifique
  "urlPath": "https://bucket.url/image.jpg",
  "mediaType": "IMAGE" // ou "VIDEO"
}
```
**Réponse (201 Created) :**
Objet `Media` créé.

### `GET /api/family/[familyId]/media`
**Rôle :** Lister tous les médias d'une famille.
**URL :** Remplacer `[familyId]` par l'ID de la famille, ex: `/api/family/1/media`
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

## Chat

### `POST /api/chat/message`
**Rôle :** Envoyer un message dans une chat room.
**Body :**
```json
{
  "chatRoomId": 1,
  "content": "Bonjour la famille !"
}
```
**Réponse (201 Created) :**
Objet `Message` créé.

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
    }
  }
]
```
