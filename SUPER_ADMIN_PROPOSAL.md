# Proposition : Ajout d'un Super-Admin de Plateforme

## 🎯 Objectif
Ajouter un rôle de super-administrateur qui peut gérer toute la plateforme, au-delà des familles individuelles.

## 📊 Structure Actuelle vs Proposée

### Actuel
```
User (global) → Member (par famille) → Role (ADMIN/EDITOR/VIEWER)
```

### Proposé
```
User (global + isSuper) → Member (par famille) → Role (ADMIN/EDITOR/VIEWER)
```

## 🔧 Modifications Nécessaires

### 1. Schéma de Base de Données
```sql
-- Ajouter un champ au modèle User
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
```

### 2. Modèle Prisma
```prisma
model User {
  id                     Int                    @id @default(autoincrement())
  email                  String                 @unique
  passwordHash           String                 @map("password_hash")
  displayName            String?                @map("display_name")
  profilePictureUrl      String?                @map("profile_picture_url")
  isSuperAdmin           Boolean                @default(false) @map("is_super_admin") // NOUVEAU
  createdAt              DateTime               @default(now()) @map("created_at")
  // ... autres champs
}
```

### 3. Middleware d'Authentification
```typescript
// lib/auth.ts - Ajouter fonction de vérification super-admin
export async function getSuperAdminFromRequest(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.isSuperAdmin) return null;
  return user;
}

export async function requireSuperAdmin(req: Request) {
  const superAdmin = await getSuperAdminFromRequest(req);
  if (!superAdmin) {
    throw new Error("Super admin access required");
  }
  return superAdmin;
}
```

## 🚀 Nouveaux Endpoints Super-Admin

### Gestion des Familles
```
GET    /api/admin/families              - Lister toutes les familles
GET    /api/admin/families/[id]         - Détails d'une famille
DELETE /api/admin/families/[id]         - Supprimer une famille
PATCH  /api/admin/families/[id]/suspend - Suspendre une famille
```

### Gestion des Utilisateurs
```
GET    /api/admin/users                 - Lister tous les utilisateurs
GET    /api/admin/users/[id]            - Détails d'un utilisateur
PATCH  /api/admin/users/[id]/suspend    - Suspendre un utilisateur
DELETE /api/admin/users/[id]            - Supprimer un utilisateur
PATCH  /api/admin/users/[id]/promote    - Promouvoir en super-admin
```

### Statistiques et Monitoring
```
GET    /api/admin/stats                 - Statistiques globales
GET    /api/admin/activity              - Activité récente
GET    /api/admin/reports               - Rapports de modération
```

### Modération de Contenu
```
GET    /api/admin/content/flagged       - Contenu signalé
PATCH  /api/admin/content/[id]/moderate - Modérer du contenu
DELETE /api/admin/content/[id]          - Supprimer du contenu
```

## 🔐 Droits du Super-Admin

### Accès Global
- ✅ Voir toutes les familles et leurs données
- ✅ Voir tous les utilisateurs et leurs activités
- ✅ Accéder aux statistiques de la plateforme
- ✅ Modérer le contenu inapproprié

### Actions Administratives
- ✅ Suspendre/réactiver des utilisateurs
- ✅ Supprimer des familles problématiques
- ✅ Promouvoir d'autres utilisateurs en super-admin
- ✅ Voir les logs d'activité et erreurs

### Limitations (Recommandées)
- ❌ Ne peut pas voir les mots de passe
- ❌ Ne peut pas modifier l'arbre généalogique directement
- ❌ Ne peut pas lire les messages privés (sauf signalement)

## 🎨 Interface Super-Admin

### Dashboard Principal
```
📊 Statistiques Globales
├── 👥 Nombre total d'utilisateurs
├── 🏠 Nombre total de familles  
├── 📈 Croissance mensuelle
└── 🚨 Alertes de modération

🔧 Actions Rapides
├── 👤 Gérer les utilisateurs
├── 🏠 Gérer les familles
├── 📝 Rapports de modération
└── 📊 Analytics détaillées
```

### Pages Spécialisées
- **Users Management** : Table avec recherche, filtres, actions en lot
- **Family Management** : Vue des familles avec métriques
- **Content Moderation** : Queue de contenu signalé
- **System Health** : Monitoring technique

## 🚀 Implémentation Recommandée

### Phase 1 : Base
1. Ajouter le champ `is_super_admin` à la DB
2. Créer les middlewares d'authentification
3. Implémenter les endpoints de base

### Phase 2 : Interface
1. Créer le dashboard super-admin
2. Implémenter la gestion des utilisateurs
3. Ajouter la gestion des familles

### Phase 3 : Avancé
1. Système de modération de contenu
2. Analytics et rapports détaillés
3. Logs d'audit et monitoring

## ⚠️ Considérations de Sécurité

### Protection des Données
- Logs d'audit pour toutes les actions super-admin
- Chiffrement des données sensibles
- Accès limité aux informations personnelles

### Contrôle d'Accès
- Authentification renforcée (2FA recommandé)
- Sessions limitées dans le temps
- IP whitelisting optionnel

### Transparence
- Notifications aux utilisateurs des actions admin
- Historique des modifications
- Possibilité de contestation

## 🎯 Cas d'Usage

### Modération
- Famille créée avec contenu inapproprié → Suspension
- Utilisateur spammant → Suspension temporaire
- Contenu signalé → Révision et action

### Support
- Utilisateur bloqué → Déblocage par super-admin
- Problème technique → Accès aux logs
- Demande de suppression RGPD → Traitement

### Analytics
- Croissance de la plateforme
- Familles les plus actives
- Fonctionnalités les plus utilisées

## 💰 Impact Développement

### Temps Estimé
- **Phase 1** : 2-3 jours (backend + auth)
- **Phase 2** : 5-7 jours (interface complète)
- **Phase 3** : 3-5 jours (fonctionnalités avancées)

### Complexité
- **Backend** : Moyenne (nouveaux endpoints + auth)
- **Frontend** : Élevée (nouvelle interface admin)
- **Sécurité** : Élevée (accès privilégié)

## 🤔 Alternative : Pas de Super-Admin

Si vous préférez garder le système décentralisé :
- Chaque famille reste autonome
- Pas de contrôle central
- Modération communautaire uniquement
- Plus simple mais moins de contrôle

---

**Recommandation** : Ajouter le super-admin pour une plateforme professionnelle, surtout si elle grandit et nécessite de la modération.