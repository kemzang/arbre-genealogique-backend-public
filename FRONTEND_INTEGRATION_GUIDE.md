# Guide d'Intégration Frontend - Nouvelles Fonctionnalités

## 🎯 Résumé Exécutif

Le backend a été enrichi avec un système complet de **fusion de familles réaliste** et de **gestion avancée des relations** incluant l'historique complet (mariages, divorces, remariages).

## 🚀 Nouveaux Endpoints Prioritaires

### 1. Fusion de Familles
```
POST /api/family/fusion-request          - Demander fusion basée sur relation concrète
POST /api/family/validate-cross-relationship - Approuver/rejeter fusion
```

### 2. Gestion des Relations
```
POST /api/relationship                   - Créer relation avec historique
PATCH /api/relationship/[id]/end         - Terminer relation (divorce/décès)
GET /api/relationship/history            - Historique complet des relations
```

### 3. Détails Enrichis
```
GET /api/person/[id]                     - Détails personne + historique relations
```

## 📊 Nouvelles Données Disponibles

### Statuts de Relations
- `ACTIVE` : Relation en cours
- `ENDED` : Relation terminée (divorce, séparation)
- `DECEASED` : Relation terminée par décès

### Informations d'Historique
```json
{
  "relationshipInfo": {
    "id": 123,
    "status": "ENDED",
    "startDate": "2020-06-15T00:00:00.000Z",
    "endDate": "2023-12-01T00:00:00.000Z",
    "endReason": "Divorce à l'amiable",
    "notes": "Garde partagée des enfants"
  }
}
```

### Statistiques Relationnelles
```json
{
  "relationshipHistory": {
    "totalMarriages": 2,
    "currentMarriages": 1,
    "divorces": 1,
    "widowed": 0
  }
}
```

## 🔄 Workflows d'Intégration

### Workflow 1 : Fusion de Familles

#### Étape 1 : Interface de Demande
```javascript
// Composant : FusionRequestForm
const submitFusionRequest = async (formData) => {
  const response = await fetch('/api/family/fusion-request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sourceFamilyId: formData.sourceFamilyId,
      targetFamilyId: formData.targetFamilyId,
      sourcePersonId: formData.sourcePersonId,    // NOUVEAU : Requis
      targetPersonId: formData.targetPersonId,    // NOUVEAU : Requis
      relationshipType: formData.relationshipType, // NOUVEAU : "UNION", "PARENTAL", "SIBLING"
      justification: formData.justification       // NOUVEAU : Optionnel
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    // result contient tous les détails de la demande
    showSuccessMessage(`Demande envoyée à ${result.targetFamily.familyName}`);
  }
};
```

#### Étape 2 : Interface d'Approbation
```javascript
// Composant : FusionApprovalPanel
const approveFusion = async (requestId) => {
  const response = await fetch('/api/family/validate-cross-relationship', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestId: requestId,
      action: "APPROVE"
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    // result.relationship contient la nouvelle relation créée automatiquement
    showSuccessMessage(result.message);
    refreshFamilyTree(); // Recharger l'arbre car nouvelles connexions
  }
};
```

### Workflow 2 : Gestion des Relations

#### Interface de Divorce/Séparation
```javascript
// Composant : EndRelationshipModal
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
  
  if (result.warning) {
    // Afficher alerte spéciale si dernière relation entre familles
    showWarning(result.warning);
  }
  
  if (result.status === "DECEASED") {
    // Interface spéciale pour décès
    showMemorialInterface(result);
  }
  
  refreshPersonDetails(); // Recharger les détails de la personne
};
```

#### Affichage de l'Historique
```javascript
// Composant : PersonHistoryTimeline
const loadPersonHistory = async (personId) => {
  const response = await fetch(`/api/person/${personId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const details = await response.json();
  
  // Afficher conjoints actuels
  setCurrentSpouses(details.currentSpouses);
  
  // Afficher ex-conjoints avec détails
  setFormerSpouses(details.formerSpouses.map(spouse => ({
    ...spouse,
    relationPeriod: `${formatDate(spouse.relationshipInfo.startDate)} - ${formatDate(spouse.relationshipInfo.endDate)}`,
    endReason: spouse.relationshipInfo.endReason
  })));
  
  // Afficher statistiques
  setStats(details.relationshipHistory);
};
```

## 🎨 Recommandations UI/UX

### Interface de Fusion de Familles
1. **Sélecteur en cascade** : Famille → Personne de cette famille
2. **Visualisation de la relation** : Schéma montrant qui sera lié à qui
3. **Types de relation avec icônes** :
   - 💍 UNION (Mariage)
   - 👨‍👩‍👧‍👦 PARENTAL (Parent-Enfant)
   - 👫 SIBLING (Frère-Sœur)

### Interface d'Historique des Relations
1. **Timeline chronologique** avec statuts colorés :
   - 🟢 ACTIVE (vert)
   - 🔴 ENDED (rouge)
   - ⚫ DECEASED (noir)
2. **Cartes de relation** avec dates et raisons
3. **Statistiques visuelles** : Graphiques en secteurs ou barres

### Notifications et Alertes
```javascript
// Types d'alertes à implémenter
const AlertTypes = {
  FUSION_APPROVED: 'success',
  LAST_FAMILY_CONNECTION: 'warning',
  RELATIONSHIP_ENDED: 'info',
  PERSON_DECEASED: 'memorial'
};
```

## 🔧 Gestion d'Erreurs

### Codes d'Erreur Spécifiques
```javascript
const handleApiError = (response, error) => {
  switch (response.status) {
    case 400:
      if (error.message.includes('relationship already exists')) {
        showError('Une relation existe déjà entre ces personnes');
      } else if (error.message.includes('must belong to')) {
        showError('Veuillez sélectionner une personne de la bonne famille');
      }
      break;
    case 403:
      showError('Vous devez être administrateur pour cette action');
      break;
    case 404:
      showError('Élément non trouvé');
      break;
  }
};
```

## 📱 Composants React Suggérés

### Nouveaux Composants à Créer
```
components/
├── FusionRequest/
│   ├── FusionRequestForm.jsx
│   ├── FusionApprovalPanel.jsx
│   └── FamilyPersonSelector.jsx
├── RelationshipHistory/
│   ├── RelationshipTimeline.jsx
│   ├── RelationshipCard.jsx
│   └── RelationshipStats.jsx
└── RelationshipManagement/
    ├── EndRelationshipModal.jsx
    └── RelationshipStatusBadge.jsx
```

### Hooks Utilitaires
```javascript
// hooks/useRelationshipHistory.js
export const useRelationshipHistory = (personId) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (personId) {
      loadPersonHistory(personId).then(setHistory).finally(() => setLoading(false));
    }
  }, [personId]);
  
  return { history, loading, refresh: () => loadPersonHistory(personId) };
};
```

## 🚀 Migration des Composants Existants

### Composants à Mettre à Jour
1. **PersonProfile** : Ajouter onglet "Historique des relations"
2. **FamilyTree** : Afficher statuts des relations (actives/terminées)
3. **PersonCard** : Ajouter badges de statut relationnel
4. **AdminPanel** : Ajouter section "Demandes de fusion"

### Nouvelles Props à Ajouter
```javascript
// PersonCard.jsx
<PersonCard 
  person={person}
  relationshipStatus="ACTIVE" // NOUVEAU
  relationshipHistory={history} // NOUVEAU
  showHistoryButton={true} // NOUVEAU
/>

// FamilyTree.jsx
<FamilyTree 
  families={families}
  showRelationshipStatuses={true} // NOUVEAU
  highlightEndedRelations={false} // NOUVEAU
/>
```

## ✅ Checklist d'Intégration

### Phase 1 : Fusion de Familles
- [ ] Créer formulaire de demande de fusion
- [ ] Implémenter sélecteur famille → personne
- [ ] Créer interface d'approbation pour admins
- [ ] Ajouter notifications de demandes en attente
- [ ] Tester workflow complet de fusion

### Phase 2 : Gestion des Relations
- [ ] Créer interface de fin de relation
- [ ] Implémenter timeline d'historique
- [ ] Ajouter statistiques relationnelles
- [ ] Créer badges de statut de relation
- [ ] Tester tous les scénarios (divorce, décès, etc.)

### Phase 3 : Améliorations UI
- [ ] Mettre à jour arbre généalogique avec statuts
- [ ] Ajouter filtres par statut de relation
- [ ] Créer dashboard de statistiques familiales
- [ ] Implémenter recherche dans l'historique
- [ ] Optimiser performances pour gros historiques

## 🎯 Points d'Attention

1. **Gestion des dates** : Toutes les dates sont en format ISO 8601
2. **Permissions** : Vérifier les droits avant d'afficher les actions
3. **Performance** : L'historique peut être volumineux, implémenter pagination
4. **Accessibilité** : Utiliser des couleurs ET des icônes pour les statuts
5. **Responsive** : Timeline doit s'adapter aux petits écrans

---

**🚀 Prêt pour l'intégration !** Ce guide contient tout ce dont vous avez besoin pour intégrer les nouvelles fonctionnalités. Le backend est 100% fonctionnel et testé.