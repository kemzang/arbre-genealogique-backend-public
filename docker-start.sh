#!/bin/sh

# Attendre que la DB soit prête (géré par depends_on healthcheck dans compose, mais bonne pratique)
echo "🚀 Démarrage de l'application..."

# Appliquer le schéma Prisma
echo "⚙️ Synchronisation de la base de données..."
npx prisma db push --accept-data-loss

# Initialiser les données (Super Admin, etc.)
echo "🌱 Initialisation des données..."
npx prisma db seed

# Lancer l'app
echo "✅ Serveur prêt sur le port 3000"
node server.js
