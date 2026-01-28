# 🌲 Guide Front-End : Rendu de l'Arbre Généalogique

Ce guide explique comment transformer les données de l'API (`/api/tree`) en une visualisation d'arbre généalogique professionnelle gérant les unions (mariages) et les descendances.

## 📊 Structure des Données

L'API renvoie :
- `persons`: Liste des individus.
- `relationships`: Liste des liens (`UNION`, `PARENTAL`, `SIBLING`).

## 🛠️ Recommandation de Librairie
Pour un rendu de haute qualité, il est recommandé d'utiliser :
- **React Flow** ou **D3.js** (pour un contrôle total)
- **React Family Tree** (spécialisé)
- **GoJS** (très puissant mais payant)

## 📐 Algorithme de Placement (Le Secret)

Pour ne pas avoir le problème de l'image (branches qui partent d'une seule personne), suivez cette logique :

### 1. Gestion des Unions (Mariages)
- Quand deux personnes ont une relation `type: "UNION"`, elles doivent être placées sur la **même ligne horizontale** (le même niveau).
- Tracez une ligne horizontale courte entre les deux.

### 2. Point de Jonction des Enfants
- **NE FAITES PAS** partir la ligne de l'enfant directement du père ou de la mère.
- Créez un **point virtuel** au milieu de la ligne d'union entre les deux parents.
- Les lignes vers les enfants doivent partir de ce **point central**.

### 3. Hiérarchie des Générations
- Niveau 0 : Grands-parents
- Niveau 1 : Parents
- Niveau 2 : Enfants
- Chaque génération doit avoir une coordonnée `Y` fixe.

## 💻 Exemple de Structure Logique (Pseudo-code)

```javascript
// 1. Grouper les unions
const unions = relationships.filter(r => r.type === 'UNION');

// 2. Trouver les enfants pour chaque union
const getChildrenOfUnion = (parentAId, parentBId) => {
  const childrenA = relationships
    .filter(r => r.type === 'PARENTAL' && r.personAId === parentAId)
    .map(r => r.personBId);
    
  const childrenB = relationships
    .filter(r => r.type === 'PARENTAL' && r.personAId === parentBId)
    .map(r => r.personBId);
    
  // L'enfant appartient à l'union s'il est lié aux deux parents
  return childrenA.filter(id => childrenB.includes(id));
};
```

## 🎨 Design UI (Aesthetics)

Pour l'aspect **Premium** (WOW effect) :
1. **Cards** : Utilisez des cartes avec des coins arrondis (`border-radius`), une légère ombre (`box-shadow`) et une bordure colorée selon le genre (ex: Bleu/Rose discret ou Or pour les ancêtres).
2. **Avatars** : Cercles avec les initiales ou photo de profil.
3. **Lignes** : Utilisez des lignes courbées (`Bezier curves`) plutôt que des lignes droites cassées.
4. **Zoom/Pan** : Permettez à l'utilisateur de se déplacer dans l'arbre avec la souris.

## 🏁 Résultat Attendu

```
      [ Père ] --------- [ Mère ]  <-- Union (Même niveau Y)
                   |
         +---------+---------+
         |                   |
    [ Enfant 1 ]        [ Enfant 2 ]  <-- Descendance (Niveau Y + 1)
```

## � Comment lier les membres (Côté Front)

Pour que l'arbre se construise bien, le front-end doit envoyer les bonnes données au back-end.

### Convention de l'API
| Relation | personAId | personBId |
| :--- | :--- | :--- |
| **Parent/Enfant** | **Parent** (Père/Mère) | **Enfant** |
| **Mari/Femme** | Conjoint 1 | Conjoint 2 |

### Exemple de flux d'ajout (Famille de 3)
1. `POST /api/person` -> Crée "Jean" (ID: 10)
2. `POST /api/person` -> Crée "Léa" (ID: 11)
3. `POST /api/person` -> Crée "Théo" (ID: 12)
4. `POST /api/relationship` -> `{ personAId: 10, personBId: 11, type: "UNION" }` (Lier Jean et Léa)
5. `POST /api/relationship` -> `{ personAId: 10, personBId: 12, type: "PARENTAL" }` (Jean est le père de Théo)
6. `POST /api/relationship` -> `{ personAId: 11, personBId: 12, type: "PARENTAL" }` (Léa est la mère de Théo)

---

## 🚀 Rendu Visuel des Liens

Pour éviter le problème de l'image (lignes qui partent d'un seul parent), le développeur front-end doit implémenter cette logique :

1. **Détection des Couples** :
   - Chercher les relations `type: "UNION"`.
   - Placer ces deux personnes côte à côte.
2. **Nœud de Descendance** :
   - Créer un point de jonction (invisible ou petit point) au milieu de la ligne reliant le couple.
   - Faire partir toutes les lignes vers les enfants (`PARENTAL`) de ce point.

---

En suivant cette convention, le front-end saura toujours qui est le parent et qui est l'enfant, et pourra dessiner des lignes propres qui partent du centre du couple plutôt que d'une seule personne.
