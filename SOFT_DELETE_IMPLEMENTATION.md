# Implémentation du Soft Delete

## 📋 Résumé

Tous les endpoints de suppression utilisent maintenant le **soft delete** au lieu de supprimer physiquement les données de la base de données. Cela permet de conserver l'historique et la traçabilité.

---

## 🗄️ Champs Ajoutés

### 1. ChatRoomParticipant
```prisma
leftAt DateTime? @map("left_at")
```
- `null` : Participant actif
- `Date` : Participant qui a quitté

### 2. FamilyEvent
```prisma
deletedAt DateTime? @map("deleted_at")
```
- `null` : Événement actif
- `Date` : Événement supprimé

### 3. Relationship
```prisma
deletedAt DateTime? @map("deleted_at")
```
- `null` : Relation active
- `Date` : Relation supprimée

---

## 🔄 Endpoints Modifiés

### Participants de Salon

**POST `/api/chat/rooms/leave`** - Quitter un salon
- Avant : `DELETE` physique
- Maintenant : Met `leftAt = new Date()`

**DELETE `/api/chat/rooms/participants`** - Retirer un participant (admin)
- Avant : `DELETE` physique
- Maintenant : Met `leftAt = new Date()`

**GET `/api/chat/rooms`** - Liste des salons
- Filtre : `leftAt = null`

**GET `/api/chat/rooms/[id]`** - Détails d'un salon
- Filtre participants : `leftAt = null`

**GET `/api/chat/rooms/participants`** - Liste des participants
- Filtre : `leftAt = null`

---

### Événements

**DELETE `/api/event/[id]`** - Supprimer un événement
- Avant : `DELETE` physique
- Maintenant : Met `deletedAt = new Date()`

**GET `/api/event/[id]`** - Détails d'un événement
- Filtre : `deletedAt = null`

**GET `/api/family/[familyId]/events`** - Liste des événements
- Filtre : `deletedAt = null`

---

### Relations

**DELETE `/api/relationship/[id]`** - Supprimer une relation
- Avant : `DELETE` physique
- Maintenant : Met `deletedAt = new Date()`

**GET `/api/tree`** - Arbre généalogique
- Filtre : `deletedAt = null`

**GET `/api/person/[id]`** - Détails d'une personne
- Filtre relations : `deletedAt = null`

---

## 🚫 Exceptions (Hard Delete Maintenu)

Ces endpoints gardent la suppression physique car ce sont des actions administratives rares :

1. **DELETE `/api/admin/users/[id]`** - Suppression d'utilisateur (Super Admin)
2. **DELETE `/api/admin/families/[id]`** - Suppression de famille (Super Admin)

---

## 📊 Avantages du Soft Delete

✅ **Traçabilité complète**
- Historique des actions
- Audit et conformité

✅ **Récupération possible**
- Possibilité de restaurer des données
- Annulation d'erreurs

✅ **Statistiques**
- Analyse des comportements
- Rapports historiques

✅ **Intégrité référentielle**
- Pas de problèmes de clés étrangères
- Relations préservées

---

## 🔧 Migrations Appliquées

1. `20260313145244_add_left_at_to_chat_participants`
   - Ajoute `left_at` à `chat_room_participants`

2. `20260313163934_add_soft_delete_to_events_and_relationships`
   - Ajoute `deleted_at` à `family_events`
   - Ajoute `deleted_at` à `relationships`

---

## 💻 Pour le Frontend

### Aucun changement nécessaire!

Les endpoints filtrent automatiquement les données supprimées. Le frontend continue de fonctionner normalement.

### Nouveaux champs dans les réponses

Les objets peuvent maintenant contenir :
- `leftAt` : Pour les participants
- `deletedAt` : Pour les événements et relations

Ces champs sont généralement `null` (données actives). Le frontend peut les ignorer.

---

## 🔮 Fonctionnalités Futures Possibles

### Restauration
Créer des endpoints pour restaurer des données supprimées :
```typescript
// Restaurer un événement
PATCH /api/event/[id]/restore
// Met deletedAt = null
```

### Historique
Afficher l'historique des suppressions :
```typescript
// Voir les événements supprimés
GET /api/event/deleted
// Filtre: deletedAt != null
```

### Nettoyage automatique
Supprimer définitivement les données après X jours :
```typescript
// Cron job quotidien
// DELETE physique si deletedAt < now() - 90 jours
```

---

## 📝 Notes Techniques

### Requêtes Prisma

**Avant :**
```typescript
await prisma.familyEvent.delete({ where: { id } });
```

**Maintenant :**
```typescript
await prisma.familyEvent.update({ 
  where: { id },
  data: { deletedAt: new Date() }
});
```

### Filtrage

Toujours ajouter `deletedAt: null` dans les requêtes :
```typescript
await prisma.familyEvent.findMany({
  where: {
    familyId: 1,
    deletedAt: null  // ← Important!
  }
});
```

---

## ✅ Checklist de Vérification

- [x] Schéma Prisma mis à jour
- [x] Migrations créées et appliquées
- [x] Endpoints DELETE modifiés
- [x] Endpoints GET filtrés
- [x] Client Prisma régénéré
- [x] Documentation mise à jour

---

## 🚀 Déploiement

Les migrations seront appliquées automatiquement lors du déploiement sur Vercel grâce au script build :

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

---

## 📞 Support

Pour toute question sur l'implémentation du soft delete, contactez l'équipe backend.
