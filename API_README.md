# Documentation API Backend

Ce document recense tous les endpoints disponibles dans le backend, leur rôle, le format du corps de la requête (body) attendu et le format de la réponse.

## ⚙️ Configuration

### Base de données
- **Type** : MySQL
- **ORM** : Prisma 6.x
- **Workflow** : ⚠️ Utilisez la commande suivante pour toute modification du schéma :
  ```bash
  npx prisma migrate dev --name <description>
  ```
  *(Le dossier `prisma/migrations` contient l'historique des changements).*

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

### 2026-02-03 - � Système Super-Admin Complet
- ✅ **Super-Admin de plateforme** : Nouveau rôle `isSuperAdmin` au niveau utilisateur
- ✅ **Gestion des utilisateurs** : Endpoints pour lister, voir détails, promouvoir, supprimer
- ✅ **Gestion des familles** : Endpoints pour lister, voir détails, supprimer les familles
- ✅ **Statistiques globales** : Dashboard avec métriques complètes de la plateforme
- ✅ **Monitoring d'activité** : Suivi en temps réel des actions utilisateurs
- ✅ **Bootstrap sécurisé** : Endpoint pour créer le premier super-admin
- ✅ **Authentification renforcée** : Middlewares de vérification super-admin

### 2026-02-03 - 🚀 Système de Relations Avancé & Historique Complet
- ✅ **Fusion de familles réaliste** : Basée sur des relations concrètes entre personnes spécifiques
- ✅ **Gestion des divorces/séparations** : Endpoint `/api/relationship/[id]/end` pour terminer des relations
- ✅ **Historique complet des relations** : Conservation de toutes les relations avec dates, raisons, notes
- ✅ **Statuts de relations** : ACTIVE, ENDED, DECEASED avec transitions automatiques
- ✅ **Détails de personne enrichis** : Conjoints actuels vs anciens, statistiques relationnelles
- ✅ **Endpoint d'historique** : `/api/relationship/history` pour consulter l'historique complet
- ✅ **Validation renforcée** : Vérification des personnes, familles connectées, relations existantes
- ✅ **Création automatique de relations** : Lors de l'approbation de fusion de familles

### 2026-02-01 - 🚀 Système Pro & Fusion de Familles
- ✅ Mise en place des migrations Prisma (`prisma migrate dev`)
- ✅ **Liaisons Inter-Familles** : Support de la création de relations entre personnes de deux familles différentes.
- ✅ **Nouveaux modèles** : `FamilyMergeRequest` et `FamilyConnection`.
- ✅ **Nouveaux endpoints** : `/api/family/fusion-request` et `/api/family/validate-cross-relationship`.
- ✅ **Arbre agrégé** : L'API `/api/tree` retourne maintenant les données des familles connectées.

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
  "email": "jean@example.com",
  "password": "monMotDePasse",
  "name": "Jean Dupont",
  "profilePictureUrl": "https://example.com/photo.jpg" // Requis. Photo obligatoire pour l'affichage dans l'arbre.
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

### 🚀 `POST /api/family/fusion-request` ⭐ (Nouveau)
**Rôle :** Initier une demande de lien (fusion) entre deux familles basée sur une relation concrète entre deux personnes.
- **Droits** : Réservé aux **ADMIN** de la famille source.
- **Logique** : La fusion doit être justifiée par une relation réelle (mariage, adoption, etc.) entre une personne de chaque famille.
**Headers :** `Authorization: Bearer <token>`
**Body :**
```json
{
  "sourceFamilyId": 1,
  "targetFamilyId": 2,
  "sourcePersonId": 10,        // Personne de la famille source (requis)
  "targetPersonId": 15,        // Personne de la famille cible (requis)
  "relationshipType": "UNION", // "PARENTAL", "UNION", "SIBLING" (requis)
  "justification": "Mariage entre Jean (famille A) et Marie (famille B) prévu en juin 2024" // Optionnel
}
```
**Réponse (201 Created) :**
```json
{
  "id": 123,
  "sourceFamilyId": 1,
  "targetFamilyId": 2,
  "requesterId": 5,
  "sourcePersonId": 10,
  "targetPersonId": 15,
  "relationshipType": "UNION",
  "justification": "Mariage entre Jean et Marie prévu en juin 2024",
  "status": "PENDING",
  "createdAt": "2024-02-03T17:35:12.000Z",
  "sourceFamily": {
    "familyName": "Famille Dupont"
  },
  "targetFamily": {
    "familyName": "Famille Martin"
  },
  "sourcePerson": {
    "firstName": "Jean",
    "lastName": "Dupont"
  },
  "targetPerson": {
    "firstName": "Marie",
    "lastName": "Martin"
  },
  "requester": {
    "displayName": "Admin Dupont"
  }
}
```
**Erreurs possibles :**
- 400: Champs requis manquants
- 400: Personne source n'appartient pas à la famille source
- 400: Personne cible n'appartient pas à la famille cible
- 400: Une relation existe déjà entre ces personnes
- 400: Une demande en attente existe déjà pour ces personnes
- 403: Utilisateur n'est pas admin de la famille source

### 🚀 `POST /api/family/validate-cross-relationship` ⭐ (Nouveau)
**Rôle :** Accepter ou rejeter une demande de fusion.
- **Droits** : Réservé aux **ADMIN** de la famille cible.
- **Effet** : Si `APPROVE`, crée automatiquement :
  1. Une `FamilyConnection` permanente entre les deux familles
  2. La relation concrète (`Relationship`) entre les deux personnes spécifiées
**Headers :** `Authorization: Bearer <token>`
**Body :**
```json
{
  "requestId": 123,    // ID de la demande (requis)
  "action": "APPROVE"  // "APPROVE" ou "REJECT" (requis)
}
```
**Réponse (200 OK) pour APPROVE :**
```json
{
  "updatedRequest": {
    "id": 123,
    "status": "APPROVED",
    "sourceFamilyId": 1,
    "targetFamilyId": 2,
    "sourcePersonId": 10,
    "targetPersonId": 15,
    "relationshipType": "UNION"
  },
  "connection": {
    "id": 45,
    "familyAId": 1,
    "familyBId": 2,
    "createdAt": "2024-02-03T17:40:00.000Z"
  },
  "relationship": {
    "id": 67,
    "personAId": 10,
    "personBId": 15,
    "type": "UNION",
    "status": "ACTIVE",
    "startDate": "2024-02-03T17:40:00.000Z",
    "isBiological": true
  },
  "message": "Families connected through UNION relationship between Jean and Marie"
}
```
**Réponse (200 OK) pour REJECT :**
```json
{
  "id": 123,
  "status": "REJECTED",
  "sourceFamilyId": 1,
  "targetFamilyId": 2
}
```
**Erreurs possibles :**
- 400: requestId ou action manquant
- 403: Utilisateur n'est pas admin de la famille cible
- 404: Demande non trouvée ou déjà traitée

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
**Rôle :** Récupérer toutes les personnes et relations pour construire l'arbre.
- **Nouveau** : Retourne automatiquement les données de la famille demandée **ET** de toutes les familles qui lui sont connectées (via `FamilyConnection`).
**Query Params :** `familyId` (Optionnel si l'utilisateur n'a qu'une famille active, sinon requis)
**Réponse (200 OK) :**
```json
{
  "persons": [...], // Tout le monde dans le réseau de familles liées
  "relationships": [...],
  "primaryFamilyId": 1,
  "connectedFamiliesCount": 2
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
  "gender": "M", // "M", "F", "O"
  "bio": "Historien de la famille",
  "profilePictureUrl": "https://example.com/photo.jpg", // Optionnel (hérité du User si lié)
  "linkedUserId": 1 // Optionnel
}
```
**Réponse (201 Created) :**
Objet `Person` créé.

### `POST /api/relationship`
**Rôle :** Créer un lien de parenté entre deux personnes existantes.
- **Nouveau** : Supporte les liens **Inter-Familles**. Si `personA` et `personB` sont de familles différentes, une `FamilyConnection` approuvée doit exister entre ces familles.
- **Historique** : Chaque relation est créée avec un statut ACTIVE et peut inclure des dates et notes.
**Headers :** `Authorization: Bearer <token>`
**Body :**
```json
{
  "personAId": 1,                    // ID de la première personne (requis)
  "personBId": 2,                    // ID de la seconde personne (requis)
  "type": "UNION",                   // "PARENTAL", "UNION", "SIBLING" (requis)
  "isBiological": true,              // true/false (optionnel, défaut: true)
  "startDate": "2024-06-15",         // Date de début (optionnel, défaut: aujourd'hui)
  "notes": "Mariage célébré à Paris" // Notes additionnelles (optionnel)
}
```
**Réponse (201 Created) :**
```json
{
  "id": 123,
  "personAId": 1,
  "personBId": 2,
  "type": "UNION",
  "isBiological": true,
  "status": "ACTIVE",
  "startDate": "2024-06-15T00:00:00.000Z",
  "endDate": null,
  "endReason": null,
  "notes": "Mariage célébré à Paris"
}
```
**Erreurs possibles :**
- 400: personAId, personBId ou type manquant
- 403: Utilisateur n'est pas membre actif des familles concernées
- 400: Familles non connectées (pour relations inter-familles)
- 404: Une des personnes n'existe pas

### 🚀 `PATCH /api/relationship/[id]/end` ⭐ (Nouveau)
**Rôle :** Terminer une relation (divorce, séparation, décès, etc.) sans la supprimer de l'historique.
**Headers :** `Authorization: Bearer <token>`
**Body :**
```json
{
  "endReason": "Divorce à l'amiable",     // Raison de la fin (requis)
  "endDate": "2024-12-01",               // Date de fin (optionnel, défaut: aujourd'hui)
  "notes": "Garde partagée des enfants"  // Notes additionnelles (optionnel)
}
```
**Réponse (200 OK) :**
```json
{
  "id": 123,
  "personAId": 1,
  "personBId": 2,
  "type": "UNION",
  "status": "ENDED",                     // Ou "DECEASED" si décès mentionné
  "startDate": "2020-06-15T00:00:00.000Z",
  "endDate": "2024-12-01T00:00:00.000Z",
  "endReason": "Divorce à l'amiable",
  "notes": "Garde partagée des enfants",
  "personA": {
    "firstName": "Jean",
    "lastName": "Dupont"
  },
  "personB": {
    "firstName": "Marie",
    "lastName": "Martin"
  }
}
```
**Réponse avec avertissement (si dernière relation entre familles) :**
```json
{
  "id": 123,
  "status": "ENDED",
  "warning": "This was the last active relationship between the families. Consider reviewing family connection."
}
```
**Erreurs possibles :**
- 400: endReason manquant
- 403: Utilisateur n'est pas membre actif des familles concernées
- 404: Relation non trouvée

### 🚀 `GET /api/relationship/history` ⭐ (Nouveau)
**Rôle :** Récupérer l'historique complet des relations pour une personne ou famille avec statistiques.
**Headers :** `Authorization: Bearer <token>`
**Query Params :**
- `personId` (optionnel) : ID de la personne pour son historique personnel
- `familyId` (optionnel) : ID de la famille pour l'historique familial
- **Note :** Au moins un des deux paramètres est requis
**Réponse (200 OK) :**
```json
{
  "relationships": [
    {
      "id": 123,
      "personAId": 1,
      "personBId": 2,
      "type": "UNION",
      "status": "ENDED",
      "startDate": "2020-06-15T00:00:00.000Z",
      "endDate": "2023-12-01T00:00:00.000Z",
      "endReason": "Divorce à l'amiable",
      "notes": "Garde partagée",
      "personA": {
        "id": 1,
        "firstName": "Jean",
        "lastName": "Dupont",
        "familyId": 1
      },
      "personB": {
        "id": 2,
        "firstName": "Marie",
        "lastName": "Martin",
        "familyId": 2
      }
    }
  ],
  "activeRelationships": [...],    // Relations avec status: "ACTIVE"
  "endedRelationships": [...],     // Relations avec status: "ENDED"
  "deceasedRelationships": [...],  // Relations avec status: "DECEASED"
  "stats": {
    "total": 3,
    "active": 1,
    "ended": 1,
    "deceased": 1,
    "byType": {
      "unions": 2,
      "parental": 1,
      "siblings": 0
    }
  }
}
```
**Erreurs possibles :**
- 400: familyId ou personId requis
- 403: Utilisateur n'est pas membre actif de la famille
- 404: Personne non trouvée (si personId fourni)

### `GET /api/person/[id]` ⭐ (Amélioré)
**Rôle :** Obtenir les détails complets d'une personne avec **historique complet des relations**.
**Headers :** `Authorization: Bearer <token>`
**URL :** Remplacer `[id]` par l'ID de la personne, ex: `/api/person/123`
**Réponse (200 OK) :**
```json
{
  "person": {
    "id": 1,
    "firstName": "Jean",
    "lastName": "Dupont",
    "birthDate": "1985-03-15T00:00:00.000Z",
    "deathDate": null,
    "gender": "M",
    "bio": "Père de famille, ingénieur",
    "profilePictureUrl": "https://example.com/photo.jpg",
    "linkedUserId": 5,
    "familyId": 1,
    "media": [...]
  },
  "parents": [
    {
      "id": 10,
      "firstName": "Pierre",
      "lastName": "Dupont",
      "relationshipInfo": {
        "id": 200,
        "status": "ACTIVE",
        "startDate": "1985-03-15T00:00:00.000Z",
        "endDate": null,
        "endReason": null,
        "isBiological": true,
        "notes": null
      }
    }
  ],
  "children": [
    {
      "id": 20,
      "firstName": "Lucas",
      "lastName": "Dupont",
      "relationshipInfo": {
        "id": 201,
        "status": "ACTIVE",
        "startDate": "2010-08-20T00:00:00.000Z",
        "isBiological": true
      }
    }
  ],
  "currentSpouses": [
    {
      "id": 2,
      "firstName": "Sophie",
      "lastName": "Dupont",
      "relationshipInfo": {
        "id": 202,
        "status": "ACTIVE",
        "startDate": "2024-01-10T00:00:00.000Z",
        "notes": "Second mariage"
      }
    }
  ],
  "formerSpouses": [
    {
      "id": 3,
      "firstName": "Marie",
      "lastName": "Martin",
      "relationshipInfo": {
        "id": 203,
        "status": "ENDED",
        "startDate": "2008-06-15T00:00:00.000Z",
        "endDate": "2023-12-01T00:00:00.000Z",
        "endReason": "Divorce à l'amiable",
        "notes": "Garde partagée des enfants"
      }
    }
  ],
  "allSpouses": [
    // Historique complet (currentSpouses + formerSpouses)
  ],
  "siblings": [
    {
      "id": 4,
      "firstName": "Paul",
      "lastName": "Dupont",
      "relationshipInfo": {
        "id": 204,
        "status": "ACTIVE",
        "isBiological": true
      }
    }
  ],
  "relationshipHistory": {
    "totalMarriages": 2,
    "currentMarriages": 1,
    "divorces": 1,
    "widowed": 0
  }
}
```
**Erreurs possibles :**
- 401: Token manquant ou invalide
- 403: Utilisateur n'est pas membre actif de la famille
- 404: Personne non trouvée

**Chaque relation inclut maintenant :**
```json
{
  "relationshipInfo": {
    "id": 123,
    "status": "ENDED",        // "ACTIVE", "ENDED", "DECEASED"
    "startDate": "2020-06-15T00:00:00.000Z",
    "endDate": "2023-12-01T00:00:00.000Z",
    "endReason": "Divorce à l'amiable",
    "isBiological": true,
    "notes": "Garde partagée des enfants"
  }
}
```

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

---

## 🔄 Nouveaux Endpoints - Guide d'Intégration Frontend

### Workflow Complet : Fusion de Familles

#### 1. **Initier une Demande de Fusion**
```javascript
// Frontend: Formulaire de demande de fusion
const createFusionRequest = async (formData) => {
  const response = await fetch('/api/family/fusion-request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sourceFamilyId: formData.sourceFamilyId,
      targetFamilyId: formData.targetFamilyId,
      sourcePersonId: formData.sourcePersonId,
      targetPersonId: formData.targetPersonId,
      relationshipType: formData.relationshipType, // "UNION", "PARENTAL", "SIBLING"
      justification: formData.justification
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    // result contient tous les détails de la demande créée
    console.log('Demande créée:', result);
  }
};
```

#### 2. **Valider une Demande de Fusion**
```javascript
// Frontend: Interface d'approbation pour les admins
const validateFusionRequest = async (requestId, action) => {
  const response = await fetch('/api/family/validate-cross-relationship', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestId: requestId,
      action: action // "APPROVE" ou "REJECT"
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    if (action === "APPROVE") {
      // result.relationship contient la nouvelle relation créée
      // result.connection contient la connexion entre familles
      console.log('Familles connectées:', result.message);
    }
  }
};
```

### Workflow Complet : Gestion des Relations

#### 3. **Créer une Relation avec Historique**
```javascript
// Frontend: Formulaire de création de relation
const createRelationship = async (relationData) => {
  const response = await fetch('/api/relationship', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personAId: relationData.personAId,
      personBId: relationData.personBId,
      type: relationData.type,
      isBiological: relationData.isBiological || true,
      startDate: relationData.startDate, // Format: "2024-06-15"
      notes: relationData.notes
    })
  });
  
  const result = await response.json();
  // result contient la relation créée avec status: "ACTIVE"
};
```

#### 4. **Terminer une Relation (Divorce/Séparation)**
```javascript
// Frontend: Interface de divorce/séparation
const endRelationship = async (relationshipId, endData) => {
  const response = await fetch(`/api/relationship/${relationshipId}/end`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endReason: endData.reason,     // "Divorce", "Décès", "Séparation"
      endDate: endData.date,         // Optionnel
      notes: endData.notes           // Optionnel
    })
  });
  
  const result = await response.json();
  // result.status sera "ENDED" ou "DECEASED"
  // Peut contenir result.warning si dernière relation entre familles
};
```

#### 5. **Afficher l'Historique des Relations**
```javascript
// Frontend: Page d'historique personnel
const getPersonHistory = async (personId) => {
  const response = await fetch(`/api/relationship/history?personId=${personId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const history = await response.json();
  
  // Utiliser les données pour l'affichage
  console.log('Relations actives:', history.activeRelationships);
  console.log('Relations terminées:', history.endedRelationships);
  console.log('Statistiques:', history.stats);
};

// Frontend: Page d'historique familial
const getFamilyHistory = async (familyId) => {
  const response = await fetch(`/api/relationship/history?familyId=${familyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const history = await response.json();
  // Même structure que ci-dessus
};
```

#### 6. **Afficher les Détails Enrichis d'une Personne**
```javascript
// Frontend: Profil de personne avec historique complet
const getPersonDetails = async (personId) => {
  const response = await fetch(`/api/person/${personId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const details = await response.json();
  
  // Affichage des conjoints actuels
  details.currentSpouses.forEach(spouse => {
    console.log(`Marié(e) à ${spouse.firstName} depuis ${spouse.relationshipInfo.startDate}`);
  });
  
  // Affichage des ex-conjoints
  details.formerSpouses.forEach(exSpouse => {
    const info = exSpouse.relationshipInfo;
    console.log(`Ex-conjoint: ${exSpouse.firstName}, relation de ${info.startDate} à ${info.endDate}, raison: ${info.endReason}`);
  });
  
  // Statistiques relationnelles
  const stats = details.relationshipHistory;
  console.log(`${stats.totalMarriages} mariage(s), ${stats.divorces} divorce(s), ${stats.widowed} veuvage(s)`);
};
```

### Cas d'Usage Frontend Recommandés

#### **Interface de Fusion de Familles**
1. **Sélecteur de familles** : Dropdown avec recherche
2. **Sélecteur de personnes** : Filtré par famille sélectionnée
3. **Type de relation** : Radio buttons (Mariage, Parent-Enfant, Frère-Sœur)
4. **Justification** : Textarea pour expliquer la demande

#### **Interface de Gestion des Relations**
1. **Timeline des relations** : Affichage chronologique avec statuts
2. **Boutons d'action** : "Terminer relation", "Modifier", "Voir détails"
3. **Formulaire de fin de relation** : Raison, date, notes
4. **Statistiques visuelles** : Graphiques des mariages/divorces

#### **Notifications et Alertes**
```javascript
// Exemple d'alertes à implémenter
const handleRelationshipEnd = (result) => {
  if (result.warning) {
    // Afficher une alerte spéciale
    alert("⚠️ " + result.warning);
  }
  
  if (result.status === "DECEASED") {
    // Interface spéciale pour décès
    showMemorialInterface();
  }
};
```

### Codes d'Erreur à Gérer

| Code | Signification | Action Frontend |
|------|---------------|-----------------|
| 400 | Données invalides | Afficher erreurs de validation |
| 401 | Non authentifié | Rediriger vers login |
| 403 | Pas les droits | Afficher message "Accès refusé" |
| 404 | Ressource non trouvée | Afficher "Élément introuvable" |
| 409 | Conflit (relation existe) | Proposer de modifier l'existante |

---

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
  "familyIds": [1, 2], // Liste des IDs des familles qui pourront voir l'événement.
  "title": "Réunion de Noël 2024",
  "eventDate": "2024-12-25",
  "location": "Marseille, France",
  "visibility": "BRANCH", // "PUBLIC", "PRIVATE", "RESTRICTED", "BRANCH"
  "targetPersonId": 10, // Requis si visibility est BRANCH. Seule la lignée de cette personne verra l'événement.
  "guestPersonIds": [10, 15] // Requis si visibility est RESTRICTED.
}
```
**Réponse (201 Created) :** Objet `FamilyEvent` créé.

### `GET /api/family/[familyId]/events`
**Rôle :** Lister tous les événements accessibles dans cette famille (Filtre automatiquement selon les droits de visibilité et les branches).
**Réponse (200 OK) :**
```json
[
  {
    "id": 1,
    "title": "Secrets de famille (Côté Maternel)",
    "visibility": "BRANCH",
    "targetPersonId": 5,
    "creator": { "displayName": "Jean" }
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
**Rôle :** Modifier un événement (Titre, Date, Lieu, Visibilité).
**Body :**
```json
{
  "title": "Réunion de Noël (Modifié)",
  "location": "Marseille (Chez Mamie)",
  "visibility": "RESTRICTED",
  "guestPersonIds": [10, 11]
}
```

### `DELETE /api/event/[id]`
**Rôle :** Supprimer un événement.
**Réponse (200 OK) :** `{ "success": true }`

---

---

## 📋 Résumé des Nouveaux Endpoints

### Fusion de Familles
| Endpoint | Méthode | Rôle | Droits Requis |
|----------|---------|------|---------------|
| `/api/family/fusion-request` | POST | Demander fusion entre familles | ADMIN famille source |
| `/api/family/validate-cross-relationship` | POST | Approuver/rejeter fusion | ADMIN famille cible |

### Gestion des Relations
| Endpoint | Méthode | Rôle | Droits Requis |
|----------|---------|------|---------------|
| `/api/relationship` | POST | Créer relation avec historique | Membre actif |
| `/api/relationship/[id]/end` | PATCH | Terminer relation (divorce/décès) | Membre actif |
| `/api/relationship/history` | GET | Historique complet des relations | Membre actif |

### Détails Enrichis
| Endpoint | Méthode | Rôle | Améliorations |
|----------|---------|------|---------------|
| `/api/person/[id]` | GET | Détails de personne | + Historique relations, statistiques |

### Nouveaux Champs de Base de Données

#### Table `relationships`
- `status` : ACTIVE, ENDED, DECEASED
- `start_date` : Date de début de la relation
- `end_date` : Date de fin de la relation
- `end_reason` : Raison de la fin (divorce, décès, etc.)
- `notes` : Notes additionnelles

#### Table `family_merge_requests`
- `source_person_id` : Personne de la famille source
- `target_person_id` : Personne de la famille cible
- `relationship_type` : Type de relation (UNION, PARENTAL, SIBLING)
- `justification` : Explication de la demande

### Types de Relations Supportés
- **UNION** : Mariage, concubinage, PACS
- **PARENTAL** : Parent-enfant (biologique ou adoptif)
- **SIBLING** : Frère-sœur (biologique ou adoptif)

### Statuts de Relations
- **ACTIVE** : Relation en cours
- **ENDED** : Relation terminée (divorce, séparation)
- **DECEASED** : Relation terminée par décès

---

**🎯 Pour l'équipe Frontend :** Ce document contient toutes les spécifications nécessaires pour intégrer les nouvelles fonctionnalités de fusion de familles et de gestion avancée des relations. Chaque endpoint inclut les formats de requête/réponse exacts et les codes d'erreur à gérer.

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

**🎯 Pour l'équipe Frontend :** Ce document contient toutes les spécifications nécessaires pour intégrer les nouvelles fonctionnalités de fusion de familles et de gestion avancée des relations. Chaque endpoint inclut les formats de requête/réponse exacts et les codes d'erreur à gérer.

---

## 🔐 Super-Admin - Gestion de Plateforme

**Note importante :** Désormais, un Super-Admin est créé automatiquement au premier démarrage de l'application via le script de seed.
- **Email par défaut :** `admin@family.com`
- **Mot de passe par défaut :** `admin123`
- **Configuration :** Modifiable via `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans le fichier `.env`.

### 📊 Statistiques & Dashboard

#### `GET /api/admin/stats`
**Rôle :** Récupérer les statistiques globales de la plateforme (Dashboard).
**Query Params :**
- `period` (optional) : Nombre de jours pour les stats de croissance (défaut : 30).
**Droits :** Super-Admin uniquement.
**Réponse (200 OK) :** Contient l'aperçu (`overview`), la croissance (`growth`), la distribution par rôles/médias/relations, et le top 10 des familles.

#### `GET /api/admin/activity`
**Rôle :** Monitoring de l'activité récente en temps réel.
**Query Params :**
- `limit` (optional) : Nombre d'entrées (défaut : 50).
- `type` (optional) : Filtrer par `users`, `families`, `messages`, `media`.
**Droits :** Super-Admin uniquement.
**Réponse (200 OK) :** Listes des derniers inscrits, dernières familles créées, derniers messages, demandes de fusion et membres en attente.

### 👥 Gestion des Utilisateurs

#### `GET /api/admin/users`
**Rôle :** Liste paginée de tous les utilisateurs inscrits.
**Query Params :** `page`, `limit`, `search` (recherche par nom ou email).
**Réponse (200 OK) :** `{ "users": [...], "pagination": {...} }`.

#### `GET /api/admin/users/[id]`
**Rôle :** Détails complets d'un utilisateur (ses familles, ses messages récents, ses médias).

#### `PATCH /api/admin/users/[id]`
**Rôle :** Modifier un utilisateur ou changer son statut admin.
**Action "promote" :** Rend l'utilisateur Super-Admin. `body: { "action": "promote" }`.
**Action "demote" :** Retire les droits Super-Admin. `body: { "action": "demote" }`.

#### `DELETE /api/admin/users/[id]`
**Rôle :** Suppression définitive.
**Sécurité :** Ne peut pas se supprimer soi-même. Ne peut pas supprimer un utilisateur qui est le **seul admin** d'une famille active.

### 🏠 Gestion des Familles

#### `GET /api/admin/families`
**Rôle :** Liste paginée de toutes les familles créées.
**Query Params :** `page`, `limit`, `search`.

#### `GET /api/admin/families/[id]`
**Rôle :** Détails d'une famille : liste des membres, personnes dans l'arbre, salles de chat, médias et connexions avec d'autres familles.

#### `DELETE /api/admin/families/[id]`
**Rôle :** Suppression d'une famille.
**Sécurité :** Bloqué si la famille possède des connexions actives avec d'autres familles (pour éviter de briser les arbres inter-familles).

---

**🎯 Super-Admin System Ready !** Tous les endpoints d'administration sont protégés par le middleware `getSuperAdminFromRequest`. Le frontend doit envoyer le jeton JWT du Super-Admin dans le header `Authorization: Bearer <token>`.