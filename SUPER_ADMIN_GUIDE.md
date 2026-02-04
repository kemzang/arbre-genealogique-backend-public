# Guide d'Utilisation Super-Admin

## 🚀 Mise en Route

### 1. Initialisation Automatique (Recommandé)
 
**Désormais, le premier Super-Admin est créé automatiquement au démarrage de l'application.**
 
Les identifiants par défaut sont définis dans votre fichier `.env` :
- **Email :** `admin@family.com` (par défaut)
- **Mot de passe :** `admin123` (par défaut)
 
Vous pouvez modifier ces valeurs dans le `.env` avant le premier démarrage :
```env
ADMIN_EMAIL="votre@email.com"
ADMIN_PASSWORD="votre_mot_de_passe"
```
 
### 2. Création Manuelle (Alternative)
 
Si vous préférez créer un compte vous-même :
 
```bash
# 1. Créer un compte utilisateur normal
POST /api/users
{
  "email": "admin@votredomaine.com",
  "password": "motDePasseSecurise",
  "name": "Super Admin",
  "profilePictureUrl": "https://example.com/admin-photo.jpg"
}

# 2. Se connecter pour obtenir le token
POST /api/users/login
{
  "email": "admin@votredomaine.com",
  "password": "motDePasseSecurise"
}

# 3. Bootstrap en super-admin (si aucun n'existe)
POST /api/admin/bootstrap
Headers: Authorization: Bearer <token>
{
  "confirmEmail": "admin@votredomaine.com"
}
```

### 2. Vérifier les Privilèges

```javascript
// Frontend: Vérifier si l'utilisateur est super-admin
const checkSuperAdminStatus = async () => {
  const response = await fetch('/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 403) {
    console.log('Utilisateur normal');
  } else if (response.ok) {
    console.log('Super-admin confirmé !');
  }
};
```

## 📊 Dashboard Super-Admin

### Interface Recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                    🔐 SUPER-ADMIN DASHBOARD                  │
├─────────────────────────────────────────────────────────────┤
│  📈 Statistiques Globales                                   │
│  ├── 👥 1,250 Utilisateurs (+45 ce mois)                   │
│  ├── 🏠 180 Familles (+8 ce mois)                          │
│  ├── 👤 5,420 Personnes dans les arbres                    │
│  └── 📱 8,900 Messages échangés                            │
├─────────────────────────────────────────────────────────────┤
│  🚨 Actions Urgentes                                        │
│  ├── ⏳ 15 Membres en attente d'approbation                │
│  ├── 🔗 3 Demandes de fusion de familles                   │
│  └── 🛡️ 2 Super-admins actifs                             │
├─────────────────────────────────────────────────────────────┤
│  🔧 Actions Rapides                                         │
│  ├── [Gérer Utilisateurs] [Gérer Familles]                │
│  ├── [Voir Activité] [Statistiques Détaillées]            │
│  └── [Promouvoir Admin] [Modération]                       │
└─────────────────────────────────────────────────────────────┘
```

### Code Frontend Dashboard

```javascript
// Dashboard Component
const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [statsRes, activityRes] = await Promise.all([
      fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/admin/activity', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    setStats(await statsRes.json());
    setActivity(await activityRes.json());
  };

  return (
    <div className="super-admin-dashboard">
      <h1>🔐 Super-Admin Dashboard</h1>
      
      {/* Statistiques Globales */}
      <div className="stats-grid">
        <StatCard title="Utilisateurs" value={stats?.overview.totalUsers} growth={stats?.growth.recentUsers} />
        <StatCard title="Familles" value={stats?.overview.totalFamilies} growth={stats?.growth.recentFamilies} />
        <StatCard title="Messages" value={stats?.overview.totalMessages} />
        <StatCard title="Médias" value={stats?.overview.totalMedia} />
      </div>

      {/* Actions Urgentes */}
      <div className="urgent-actions">
        <h2>🚨 Actions Urgentes</h2>
        <UrgentItem 
          icon="⏳" 
          text={`${stats?.overview.pendingMembers} membres en attente`}
          action={() => navigate('/admin/pending-members')}
        />
        <UrgentItem 
          icon="🔗" 
          text={`${activity?.summary.totalFusionRequests} demandes de fusion`}
          action={() => navigate('/admin/fusion-requests')}
        />
      </div>

      {/* Activité Récente */}
      <div className="recent-activity">
        <h2>📈 Activité Récente</h2>
        <ActivityTimeline activities={activity?.recentUsers} />
      </div>
    </div>
  );
};
```

## 👥 Gestion des Utilisateurs

### Interface de Liste

```javascript
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');

  const loadUsers = async (page = 1) => {
    const response = await fetch(`/api/admin/users?page=${page}&search=${search}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.users);
    setPagination(data.pagination);
  };

  const promoteUser = async (userId) => {
    if (confirm('Promouvoir cet utilisateur en super-admin ?')) {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'promote' })
      });
      loadUsers(); // Recharger la liste
    }
  };

  const deleteUser = async (userId) => {
    if (confirm('Supprimer définitivement cet utilisateur ?')) {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadUsers();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    }
  };

  return (
    <div className="user-management">
      <h1>👥 Gestion des Utilisateurs</h1>
      
      <SearchBar value={search} onChange={setSearch} onSearch={() => loadUsers(1)} />
      
      <table className="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nom</th>
            <th>Familles</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.displayName}</td>
              <td>{user._count.members} familles</td>
              <td>
                {user.isSuperAdmin ? (
                  <span className="badge super-admin">🔐 Super-Admin</span>
                ) : (
                  <span className="badge user">👤 Utilisateur</span>
                )}
              </td>
              <td>
                <button onClick={() => promoteUser(user.id)}>
                  Promouvoir
                </button>
                <button onClick={() => deleteUser(user.id)} className="danger">
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination {...pagination} onPageChange={loadUsers} />
    </div>
  );
};
```

## 🏠 Gestion des Familles

### Interface de Liste avec Statistiques

```javascript
const FamilyManagement = () => {
  const [families, setFamilies] = useState([]);

  const loadFamilies = async () => {
    const response = await fetch('/api/admin/families', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setFamilies(data.families);
  };

  const deleteFamily = async (familyId, familyName) => {
    if (confirm(`Supprimer définitivement la famille "${familyName}" ?`)) {
      const response = await fetch(`/api/admin/families/${familyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadFamilies();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    }
  };

  return (
    <div className="family-management">
      <h1>🏠 Gestion des Familles</h1>
      
      <div className="families-grid">
        {families.map(family => (
          <div key={family.id} className="family-card">
            <h3>{family.familyName}</h3>
            <div className="family-stats">
              <div>👥 {family.stats.activeMembers} membres actifs</div>
              <div>👤 {family.stats.totalPersons} personnes</div>
              <div>📱 {family.stats.totalMedia} médias</div>
              <div>💬 {family.stats.totalChatRooms} salons</div>
            </div>
            <div className="family-actions">
              <button onClick={() => navigate(`/admin/families/${family.id}`)}>
                Voir Détails
              </button>
              <button 
                onClick={() => deleteFamily(family.id, family.familyName)}
                className="danger"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 📊 Statistiques et Analytics

### Graphiques Recommandés

```javascript
const StatsPage = () => {
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    const response = await fetch('/api/admin/stats?period=90', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setStats(await response.json());
  };

  return (
    <div className="stats-page">
      <h1>📊 Statistiques de la Plateforme</h1>
      
      {/* Croissance Mensuelle */}
      <div className="chart-container">
        <h2>📈 Croissance Mensuelle</h2>
        <LineChart data={stats?.growth.monthlyGrowth} />
      </div>
      
      {/* Distribution des Rôles */}
      <div className="chart-container">
        <h2>👥 Distribution des Rôles</h2>
        <PieChart data={stats?.distribution.roleStats} />
      </div>
      
      {/* Top Familles */}
      <div className="top-families">
        <h2>🏆 Top Familles</h2>
        <table>
          <thead>
            <tr>
              <th>Famille</th>
              <th>Membres</th>
              <th>Personnes</th>
              <th>Médias</th>
            </tr>
          </thead>
          <tbody>
            {stats?.topFamilies.map(family => (
              <tr key={family.id}>
                <td>{family.familyName}</td>
                <td>{family._count.members}</td>
                <td>{family._count.persons}</td>
                <td>{family._count.media}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## 🔒 Sécurité et Bonnes Pratiques

### 1. Vérifications de Sécurité

```javascript
// Middleware de vérification côté frontend
const requireSuperAdmin = (WrappedComponent) => {
  return (props) => {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      checkSuperAdminStatus();
    }, []);

    const checkSuperAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsSuperAdmin(response.ok);
      } catch (error) {
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (loading) return <div>Vérification des privilèges...</div>;
    if (!isSuperAdmin) return <div>Accès refusé</div>;

    return <WrappedComponent {...props} />;
  };
};

// Usage
const AdminDashboard = requireSuperAdmin(SuperAdminDashboard);
```

### 2. Logs d'Audit (Recommandé)

```javascript
// Fonction pour logger les actions admin
const logAdminAction = async (action, target, details) => {
  await fetch('/api/admin/audit-log', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    })
  });
};

// Usage
const promoteUser = async (userId) => {
  await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'promote' })
  });
  
  // Log de l'action
  await logAdminAction('USER_PROMOTED', userId, { newRole: 'SUPER_ADMIN' });
};
```

## 🚨 Gestion des Urgences

### Actions d'Urgence

```javascript
const EmergencyActions = () => {
  const suspendUser = async (userId) => {
    // Temporairement désactiver un utilisateur
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ suspended: true })
    });
  };

  const emergencyFamilyShutdown = async (familyId) => {
    // Fermer temporairement une famille
    if (confirm('URGENCE: Fermer cette famille ?')) {
      await fetch(`/api/admin/families/${familyId}/emergency-shutdown`, {
        method: 'POST'
      });
    }
  };

  return (
    <div className="emergency-panel">
      <h2>🚨 Actions d'Urgence</h2>
      <button className="emergency-btn" onClick={() => suspendUser(selectedUserId)}>
        Suspendre Utilisateur
      </button>
      <button className="emergency-btn" onClick={() => emergencyFamilyShutdown(selectedFamilyId)}>
        Fermer Famille
      </button>
    </div>
  );
};
```

## ✅ Checklist de Déploiement

### Avant la Mise en Production

- [ ] **Créer le premier super-admin** via `/api/admin/bootstrap`
- [ ] **Tester tous les endpoints** avec des données de test
- [ ] **Vérifier les permissions** : seuls les super-admins peuvent accéder
- [ ] **Configurer les logs** d'audit pour traçabilité
- [ ] **Documenter les procédures** d'urgence
- [ ] **Former les administrateurs** sur l'interface
- [ ] **Mettre en place la sauvegarde** des données critiques
- [ ] **Tester la récupération** en cas de suppression accidentelle

### Monitoring Recommandé

- [ ] **Alertes** sur les actions critiques (suppression, promotion)
- [ ] **Métriques** de croissance et d'utilisation
- [ ] **Surveillance** des erreurs et performances
- [ ] **Rapports** hebdomadaires d'activité

---

**🎯 Le système Super-Admin est maintenant prêt pour la production !**