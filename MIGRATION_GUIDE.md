# Guide de Migration - Amélioration du Système de Fusion de Familles

## Changements Apportés

### 1. Schéma de Base de Données
Les modèles suivants ont été améliorés :

#### `FamilyMergeRequest`
Nouveaux champs ajoutés :
- `sourcePersonId` : ID de la personne de la famille source
- `targetPersonId` : ID de la personne de la famille cible  
- `relationshipType` : Type de relation (UNION, PARENTAL, SIBLING)
- `justification` : Explication textuelle de la demande

#### `Relationship`
Nouveaux champs ajoutés :
- `status` : Statut de la relation (ACTIVE, ENDED, DECEASED)
- `startDate` : Date de début de la relation
- `endDate` : Date de fin de la relation
- `endReason` : Raison de la fin (divorce, décès, etc.)
- `notes` : Notes additionnelles

#### `Person`
Nouvelles relations ajoutées :
- `sourceRequests` : Demandes de fusion où cette personne est la source
- `targetRequests` : Demandes de fusion où cette personne est la cible

### 2. Nouveaux Endpoints

#### `PATCH /api/relationship/[id]/end`
Permet de terminer une relation (divorce, décès) sans la supprimer.

#### `GET /api/relationship/history`
Récupère l'historique complet des relations pour une personne ou famille.

## Migration de la Base de Données

### Étape 1 : Créer la Migration
```bash
npx prisma migrate dev --name improve_family_fusion_with_concrete_relationships
```

### Étape 2 : Appliquer la Migration
La migration ajoutera automatiquement les nouveaux champs avec des valeurs par défaut :
- `status` : ACTIVE pour toutes les relations existantes
- `startDate` : Date actuelle pour les relations existantes
- Les nouveaux champs de `FamilyMergeRequest` seront optionnels pour la compatibilité

### Étape 3 : Mettre à Jour le Code
Une fois la migration appliquée, vous pouvez :

1. **Décommenter le code dans `fusion-request/route.ts`** :
   - Ajouter la validation des nouveaux champs requis
   - Inclure les nouveaux champs dans la création
   - Ajouter les relations dans l'include

2. **Décommenter le code dans `validate-cross-relationship/route.ts`** :
   - Inclure les relations sourcePerson et targetPerson
   - Créer automatiquement la relation entre les personnes lors de l'approbation

3. **Tester les nouveaux endpoints** :
   - `/api/relationship/[id]/end` pour terminer des relations
   - `/api/relationship/history` pour l'historique
   - `/api/person/[id]` amélioré avec l'historique des relations

## Exemple d'Usage Après Migration

### Demande de Fusion Améliorée
```json
POST /api/family/fusion-request
{
  "sourceFamilyId": 1,
  "targetFamilyId": 2,
  "sourcePersonId": 10,
  "targetPersonId": 15,
  "relationshipType": "UNION",
  "justification": "Mariage prévu entre Jean et Marie"
}
```

### Divorce/Séparation
```json
PATCH /api/relationship/123/end
{
  "endReason": "Divorce à l'amiable",
  "endDate": "2024-12-01",
  "notes": "Garde partagée des enfants"
}
```

### Historique des Relations
```json
GET /api/person/10
// Retourne maintenant :
{
  "currentSpouses": [...],
  "formerSpouses": [...],
  "relationshipHistory": {
    "totalMarriages": 2,
    "divorces": 1,
    "widowed": 0
  }
}
```

## État Actuel

✅ **Fonctionnel** : Les endpoints fonctionnent avec l'ancien schéma
⏳ **En attente** : Migration de la base de données pour activer toutes les fonctionnalités
📝 **TODO** : Décommenter le code après la migration

Le système est maintenant prêt pour une logique de fusion de familles plus réaliste basée sur des relations concrètes entre personnes, avec un historique complet des relations (mariages, divorces, remariages).