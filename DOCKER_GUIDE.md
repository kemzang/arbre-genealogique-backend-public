# 🐳 Guide de Dockerisation

Ce projet est maintenant prêt à être lancé avec Docker et Docker Compose. Cela permet de faire tourner le backend et la base de données MySQL dans des conteneurs isolés.

## 🚀 Lancement Rapide

Assurez-vous d'avoir **Docker** et **Docker Compose** installés sur votre machine.

1.  **Lancer tout l'environnement** :
    ```bash
    docker-compose up --build
    ```

2.  **Accéder à l'application** :
    - L'API sera accessible sur : `http://localhost:3001`
    - (Le port interne est 3000, mais mappé sur 3001 pour correspondre à vos habitudes).

## 📁 Fichiers créés

- `Dockerfile` : Instructions pour construire l'image Next.js (optimisée en mode `standalone`).
- `docker-compose.yml` : Orchestre l'application et la base de données MySQL.
- `.dockerignore` : Empêche l'envoi de fichiers inutiles (comme `node_modules` locaux) dans l'image.
- `docker-start.sh` : Script qui s'assure que la base de données est synchronisée avec Prisma avant de lancer le serveur.

## 💾 Persistance des données

Deux volumes Docker sont créés automatiquement :
- `mysql_data` : Pour que vos utilisateurs et familles ne soient pas supprimés si vous éteignez Docker.
- `uploads_data` : Pour conserver les photos et vidéos uploadées dans `public/uploads`.

## ⚙️ Configuration (Variables d'environnement)

Vous pouvez modifier les accès dans le fichier `docker-compose.yml` :
- `DATABASE_URL` : Déjà configuré pour pointer vers le conteneur `db`.
- `JWT_SECRET` : À changer pour un secret plus fort en production.

## 🛠️ Commandes Utiles

- **Arrêter les conteneurs** : `docker-compose down`
- **Voir les logs** : `docker-compose logs -f app`
- **Réinitialiser la DB** : `docker-compose down -v` (Attention : supprime toutes les données !)
- **Exécuter une commande Prisma dans le conteneur** :
  ```bash
  docker-compose exec app npx prisma studio
  ```

---
**Note** : Le premier lancement peut prendre quelques minutes le temps de télécharger les images de base (Node et MySQL) et de construire l'application.
