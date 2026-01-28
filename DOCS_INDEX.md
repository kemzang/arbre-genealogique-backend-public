# 📚 Documentation - Index

Bienvenue dans la documentation du projet Arbre Généalogique !

## 🗂️ Documents disponibles

### 📖 Pour commencer

1. **[README.md](./README.md)** - Vue d'ensemble du projet
   - Présentation des fonctionnalités
   - Installation rapide
   - Technologies utilisées

2. **[SETUP.md](./SETUP.md)** - Guide d'installation complet
   - Prérequis détaillés
   - Installation pas à pas
   - Configuration de la base de données
   - Commandes utiles
   - Résolution de problèmes

### 🔧 Pour les développeurs

3. **[API_README.md](./API_README.md)** - Documentation API Backend
   - Configuration et variables d'environnement
   - Tous les endpoints disponibles
   - Format des requêtes et réponses
   - Codes d'erreur
   - Exemples d'utilisation

4. **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** - Guide Frontend
   - Authentification JWT
   - Upload de fichiers (FormData)
   - Exemples React complets
   - Bonnes pratiques
   - Débogage

### 📝 Historique et changements

5. **[CHANGELOG.md](./CHANGELOG.md)** - Historique des modifications
   - Problèmes résolus
   - Modifications détaillées
   - Impact sur le frontend
   - Leçons apprises

---

## 🎯 Guides par cas d'usage

### Je veux installer le projet
→ Suivez **[SETUP.md](./SETUP.md)**

### Je développe le frontend
→ Consultez **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)**

### Je développe le backend
→ Référez-vous à **[API_README.md](./API_README.md)**

### J'ai un problème
→ Vérifiez **[SETUP.md](./SETUP.md)** section "Résolution de problèmes"  
→ Consultez **[CHANGELOG.md](./CHANGELOG.md)** pour les problèmes connus

### Je veux comprendre les changements récents
→ Lisez **[CHANGELOG.md](./CHANGELOG.md)**

---

## 🔍 Recherche rapide

### Authentification
- Créer un compte : [API_README.md#authentification](./API_README.md#authentification)
- Utiliser le JWT : [FRONTEND_GUIDE.md#authentification](./FRONTEND_GUIDE.md#authentification)

### Upload de fichiers
- Documentation API : [API_README.md#média](./API_README.md#média)
- Exemples frontend : [FRONTEND_GUIDE.md#upload-de-fichiers](./FRONTEND_GUIDE.md#upload-de-fichiers)
- Changements récents : [CHANGELOG.md#upload-de-fichiers](./CHANGELOG.md#upload-de-fichiers)

### Arbre généalogique
- Endpoints : [API_README.md#arbre-généalogique--personnes](./API_README.md#arbre-généalogique--personnes)
- Exemples : [FRONTEND_GUIDE.md#créer-un-arbre-généalogique](./FRONTEND_GUIDE.md#créer-un-arbre-généalogique)

### Chat
- Endpoints : [API_README.md#chat](./API_README.md#chat)
- Envoyer des messages : [FRONTEND_GUIDE.md#envoyer-un-message-avec-pièces-jointes](./FRONTEND_GUIDE.md#envoyer-un-message-avec-pièces-jointes)

### Famille
- Créer/rejoindre : [API_README.md#famille](./API_README.md#famille)
- Exemples : [FRONTEND_GUIDE.md#gestion-de-famille](./FRONTEND_GUIDE.md#gestion-de-famille)

---

## 🛠️ Commandes rapides

```bash
# Installation
npm install
npx prisma generate
npx prisma db push

# Développement
npm run dev

# Base de données
npx prisma studio

# Nettoyage
Remove-Item -Recurse -Force .next
```

Plus de détails : [SETUP.md#commandes-utiles](./SETUP.md#commandes-utiles)

---

## 📊 Structure de la documentation

```
Documentation/
├── README.md              # Vue d'ensemble
├── SETUP.md              # Installation et configuration
├── API_README.md         # Documentation API complète
├── FRONTEND_GUIDE.md     # Guide pour développeurs frontend
├── CHANGELOG.md          # Historique des modifications
└── DOCS_INDEX.md         # Ce fichier (index)
```

---

## 🆘 Besoin d'aide ?

1. **Problème d'installation** → [SETUP.md](./SETUP.md)
2. **Erreur API** → [API_README.md](./API_README.md)
3. **Problème frontend** → [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)
4. **Problème connu** → [CHANGELOG.md](./CHANGELOG.md)

---

## 📅 Dernière mise à jour

**Date** : 28 Janvier 2026  
**Version** : 1.0.0  
**Prisma** : 6.19.2  
**Next.js** : 16.1.4

---

**Bonne lecture ! 📖**
