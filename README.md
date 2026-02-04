# 🌳 Arbre Généalogique - Application Familiale

Une application web complète pour gérer votre arbre généalogique, partager des photos et communiquer avec votre famille.

## ✨ Fonctionnalités

- 👥 **Gestion de famille** : Créez ou rejoignez une famille avec système de validation
- 🌲 **Arbre généalogique** : Construisez et visualisez votre arbre familial
- 💬 **Chat en temps réel** : Salons de discussion publics et privés
- 📸 **Partage de médias** : Upload et partage de photos, vidéos et documents
- 🔐 **Authentification sécurisée** : Système de connexion avec JWT
- 👤 **Profils personnalisés** : Fiches détaillées pour chaque membre de la famille

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- MySQL 8.0+
- npm

### Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd arbre_genealogique
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer la base de données**
   
   Créez une base de données MySQL :
   ```sql
   CREATE DATABASE family_tree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Configurer les variables d'environnement**
   
   Créez un fichier `.env` à la racine :
   ```env
   DATABASE_URL="mysql://root@localhost:3306/family_tree"
   JWT_SECRET="change_me_to_a_strong_secret"
   ```

5. **Initialiser la base de données**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed    # Initialise le Super-Admin
   ```

   **Identifiants Admin par défaut :**
   - **Email :** `admin@family.com`
   - **Mot de passe :** `admin123`

6. **Lancer le serveur**
   ```bash
   npm run dev
   ```

L'application sera accessible sur **http://localhost:3001**

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Guide complet d'installation et de configuration
- **[API_README.md](./API_README.md)** - Documentation complète de l'API backend
- **[SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md)** - Guide de gestion pour les super-administrateurs

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 16, React 19, TailwindCSS
- **Backend** : Next.js API Routes
- **Base de données** : MySQL + Prisma ORM 6.x
- **Authentification** : JWT (jsonwebtoken)
- **Upload de fichiers** : Système local (public/uploads)

## 📁 Structure du projet

```
arbre_genealogique/
├── app/                    # Application Next.js
│   ├── api/               # Endpoints API
│   │   ├── users/        # Authentification
│   │   ├── family/       # Gestion des familles
│   │   ├── chat/         # Messagerie
│   │   └── media/        # Upload de fichiers
│   └── ...
├── lib/                   # Utilitaires
│   ├── prisma.ts         # Client Prisma
│   └── auth.ts           # Helpers JWT
├── prisma/               # Configuration BDD
│   └── schema.prisma     # Schéma de données
├── public/
│   └── uploads/          # Fichiers uploadés
└── .env                  # Configuration (à créer)
```

## 🔑 Endpoints API (Résumé)

### 🛡️ Administration (Super-Admin uniquement)
- **Dashboard** : `GET /api/admin/stats` - Glossaire des statistiques globales
- **Monitoring** : `GET /api/admin/activity` - Flux de toutes les actions récentes
- **Gestion Utilisateurs** :
    - `GET /api/admin/users` - Liste paginée de tous les utilisateurs
    - `PATCH /api/admin/users/[id]` - Promouvoir/Rétrograder (`promote`/`demote`)
    - `DELETE /api/admin/users/[id]` - Supprimer un compte utilisateur
- **Gestion Familles** :
    - `GET /api/admin/families` - Liste de toutes les familles
    - `DELETE /api/admin/families/[id]` - Supprimer une famille entière

### 🌐 Authentification & Profil
- `POST /api/users` - Créer un compte
- `POST /api/users/login` - Se connecter

### 🏠 Famille & Membres
- `POST /api/family` - Créer une famille
- `POST /api/family/join` - Demander à rejoindre une famille
- `GET /api/family/search` - Rechercher des familles

### 🌲 Arbre Généalogique
- `GET /api/tree` - Récupérer l'arbre
- `POST /api/person` - Ajouter une personne
- `POST /api/relationship` - Créer une relation (Union, Parent, etc.)

### 💬 Chat & Médias
- `GET /api/chat/rooms` - Liste des salons
- `POST /api/chat/message` - Envoyer un message (texte + médias)
- `POST /api/media/upload` - Uploader un fichier (FormData)
- `GET /api/family/[familyId]/media` - Parcourir les médias de la famille

📖 **Documentation technique détaillée** : Voir [API_README.md](./API_README.md)

## 🔧 Commandes utiles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build production
npm run start            # Lancer en production

# Base de données
npx prisma studio        # Interface graphique BDD
npx prisma generate      # Régénérer le client Prisma
npx prisma db push       # Synchroniser le schéma
npx prisma migrate dev   # Créer une migration
```

## 🐛 Problèmes courants

### Erreur Prisma
Si vous avez une erreur `PrismaClientConstructorValidationError`, vérifiez votre version :
```bash
npm list @prisma/client
```
Vous devez avoir Prisma 6.x (pas 7.x).

### Erreur d'upload
L'endpoint `/api/media/upload` accepte du **FormData**, pas du JSON :
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('familyId', '1');
```

Plus de détails dans [SETUP.md](./SETUP.md)

## 🔐 Sécurité

⚠️ **En production** :
- Changez `JWT_SECRET` par une valeur forte et aléatoire
- Utilisez HTTPS
- Configurez les CORS
- Limitez la taille des uploads
- Utilisez un service cloud pour les fichiers (S3, Cloudinary)

## 📝 Changelog

### 2026-01-28
- ✅ Upload de fichiers via FormData
- ✅ Configuration MySQL avec Prisma 6.x
- ✅ Système de chat avec salons publics/privés
- ✅ Gestion complète de l'arbre généalogique

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

**Développé avec ❤️ pour les familles**
