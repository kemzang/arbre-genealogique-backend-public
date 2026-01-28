# Guide de Configuration - Arbre Généalogique

## 📋 Prérequis

- **Node.js** : Version 20 ou supérieure
- **MySQL** : Version 8.0 ou supérieure
- **npm** : Installé avec Node.js

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd arbre_genealogique
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer la base de données

#### Créer la base de données MySQL
```sql
CREATE DATABASE family_tree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="mysql://root@localhost:3306/family_tree"
JWT_SECRET="change_me_to_a_strong_secret"
```

**⚠️ Important :**
- Remplacez `root` par votre nom d'utilisateur MySQL
- Ajoutez le mot de passe si nécessaire : `mysql://user:password@localhost:3306/family_tree`
- Changez `JWT_SECRET` par une chaîne aléatoire sécurisée en production

### 4. Initialiser la base de données avec Prisma

#### Générer le client Prisma
```bash
npx prisma generate
```

#### Créer les tables
```bash
npx prisma db push
```

**Ou** utiliser les migrations :
```bash
npx prisma migrate dev --name init
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3001**

---

## 🗂️ Structure du projet

```
arbre_genealogique/
├── app/                      # Pages et routes Next.js
│   ├── api/                  # Endpoints API
│   │   ├── users/           # Authentification
│   │   ├── family/          # Gestion des familles
│   │   ├── member/          # Gestion des membres
│   │   ├── chat/            # Chat et messages
│   │   ├── media/           # Upload de fichiers
│   │   ├── person/          # Personnes dans l'arbre
│   │   └── relationship/    # Relations familiales
│   └── ...
├── lib/                      # Utilitaires
│   ├── prisma.ts            # Client Prisma
│   └── auth.ts              # Authentification JWT
├── prisma/                   # Configuration Prisma
│   └── schema.prisma        # Schéma de base de données
├── public/                   # Fichiers statiques
│   └── uploads/             # Fichiers uploadés par les utilisateurs
├── .env                      # Variables d'environnement (à créer)
├── package.json             # Dépendances
└── API_README.md            # Documentation complète de l'API
```

---

## 🔧 Commandes utiles

### Développement
```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Build pour production
npm run start        # Lancer en production
```

### Prisma
```bash
npx prisma studio              # Interface graphique pour la BDD
npx prisma generate            # Régénérer le client Prisma
npx prisma db push             # Synchroniser le schéma avec la BDD
npx prisma migrate dev         # Créer une nouvelle migration
npx prisma migrate reset       # Réinitialiser la BDD (⚠️ supprime les données)
```

### Base de données
```bash
# Voir les données dans Prisma Studio
npx prisma studio

# Seed la base de données (si vous avez un fichier seed)
npx prisma db seed
```

---

## 🐛 Résolution de problèmes

### Erreur : "PrismaClientConstructorValidationError"
**Cause :** Prisma 7.x a changé la configuration des connexions.

**Solution :** Vérifiez que vous utilisez Prisma 6.x :
```bash
npm list @prisma/client prisma
```

Si vous avez Prisma 7.x, downgrade vers 6.x :
```bash
npm install prisma@^6.0.0 @prisma/client@^6.0.0
npx prisma generate
```

### Erreur : "DATABASE_URL is missing"
**Cause :** Le fichier `.env` n'existe pas ou n'est pas lu.

**Solution :**
1. Vérifiez que le fichier `.env` existe à la racine du projet
2. Vérifiez qu'il contient `DATABASE_URL="mysql://..."`
3. Redémarrez le serveur de développement

### Erreur : "Can't reach database server"
**Cause :** MySQL n'est pas démarré ou la connexion est incorrecte.

**Solution :**
1. Vérifiez que MySQL est démarré
2. Testez la connexion : `mysql -u root -p`
3. Vérifiez l'URL dans `.env`

### Erreur 400 sur `/api/media/upload`
**Cause :** Le frontend envoie du JSON au lieu de FormData.

**Solution :** Utilisez FormData pour envoyer les fichiers :
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('familyId', '1');

fetch('/api/media/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Le cache Next.js cause des problèmes
**Solution :** Supprimez le dossier `.next` et redémarrez :
```bash
Remove-Item -Recurse -Force .next  # Windows PowerShell
# ou
rm -rf .next                        # Linux/Mac
npm run dev
```

---

## 📚 Documentation

- **API complète** : Voir [API_README.md](./API_README.md)
- **Schéma de base de données** : Voir [prisma/schema.prisma](./prisma/schema.prisma)
- **Prisma Docs** : https://www.prisma.io/docs
- **Next.js Docs** : https://nextjs.org/docs

---

## 🔐 Sécurité

### En développement
- Le JWT_SECRET peut être simple
- Les fichiers uploadés sont stockés localement

### En production
- ⚠️ Changez `JWT_SECRET` par une chaîne aléatoire forte (32+ caractères)
- ⚠️ Utilisez un service de stockage cloud (S3, Cloudinary) pour les fichiers
- ⚠️ Activez HTTPS
- ⚠️ Configurez les CORS correctement
- ⚠️ Limitez la taille des fichiers uploadés
- ⚠️ Validez et sanitisez toutes les entrées utilisateur

---

## 📞 Support

Pour toute question ou problème, consultez :
1. [API_README.md](./API_README.md) pour la documentation des endpoints
2. Les logs du serveur (`npm run dev`)
3. Prisma Studio (`npx prisma studio`) pour inspecter la base de données
