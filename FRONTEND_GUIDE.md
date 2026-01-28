# 📘 Guide Frontend - Utilisation de l'API

Ce document explique comment utiliser l'API backend depuis le frontend.

## 🔐 Authentification

Tous les endpoints (sauf `/api/users` et `/api/users/login`) nécessitent un token JWT.

### Obtenir un token

```javascript
// Inscription
const registerResponse = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    name: 'Jean Dupont'
  })
});

// Connexion
const loginResponse = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  })
});

const { token, user } = await loginResponse.json();
// Sauvegarder le token (localStorage, cookie, etc.)
localStorage.setItem('token', token);
```

### Utiliser le token

```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📸 Upload de fichiers (IMPORTANT)

### ⚠️ Changement majeur

L'endpoint `/api/media/upload` accepte **FormData**, pas JSON !

### ❌ Ancienne méthode (ne fonctionne plus)

```javascript
// NE FONCTIONNE PLUS !
fetch('/api/media/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    familyId: 1,
    urlPath: 'https://...'
  })
});
```

### ✅ Nouvelle méthode (obligatoire)

```javascript
// Récupérer le fichier depuis un input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// Créer le FormData
const formData = new FormData();
formData.append('file', file);
formData.append('familyId', '1');
formData.append('mediaType', 'IMAGE'); // ou 'VIDEO', 'FILE'
// formData.append('personId', '5'); // Optionnel

// Envoyer la requête
const response = await fetch('/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // ⚠️ NE PAS définir Content-Type - le navigateur le fait automatiquement !
  },
  body: formData
});

if (response.ok) {
  const media = await response.json();
  console.log('Fichier uploadé:', media);
  // media.urlPath contient le chemin : "/uploads/1738065123456-photo.jpg"
  // Accessible via : http://localhost:3001/uploads/1738065123456-photo.jpg
}
```

### Exemple complet avec React

```jsx
import { useState } from 'react';

function MediaUpload({ familyId, token }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('familyId', familyId.toString());
      formData.append('mediaType', 'IMAGE');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const media = await response.json();
      setUploadedMedia(media);
      setFile(null);
      
      console.log('✅ Upload réussi:', media);
    } catch (err) {
      setError(err.message);
      console.error('❌ Erreur upload:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange}
        accept="image/*,video/*"
      />
      
      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Upload en cours...' : 'Uploader'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {uploadedMedia && (
        <div>
          <p>✅ Fichier uploadé avec succès !</p>
          <img 
            src={uploadedMedia.urlPath} 
            alt="Uploaded" 
            style={{ maxWidth: '200px' }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 💬 Envoyer un message avec pièces jointes

Les médias doivent être uploadés **avant** d'envoyer le message.

```javascript
// 1. Uploader les fichiers
const uploadedMediaIds = [];

for (const file of files) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('familyId', familyId.toString());
  formData.append('mediaType', 'IMAGE');

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const media = await response.json();
  uploadedMediaIds.push(media.id);
}

// 2. Envoyer le message avec les IDs des médias
const messageResponse = await fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatRoomId: 1,
    content: 'Voici des photos !',
    attachmentIds: uploadedMediaIds
  })
});
```

---

## 🌲 Créer un arbre généalogique

### 1. Créer les personnes

```javascript
// Créer le père
const fatherResponse = await fetch('/api/person', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyId: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    birthDate: '1950-01-15',
    gender: 'M'
  })
});
const father = await fatherResponse.json();

// Créer la mère
const motherResponse = await fetch('/api/person', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyId: 1,
    firstName: 'Marie',
    lastName: 'Dupont',
    birthDate: '1952-03-20',
    gender: 'F'
  })
});
const mother = await motherResponse.json();

// Créer l'enfant
const childResponse = await fetch('/api/person', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyId: 1,
    firstName: 'Pierre',
    lastName: 'Dupont',
    birthDate: '1980-05-10',
    gender: 'M'
  })
});
const child = await childResponse.json();
```

### 2. Créer les relations

```javascript
// Lier le père à l'enfant
await fetch('/api/relationship', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personAId: father.id,
    personBId: child.id,
    type: 'PARENTAL',
    isBiological: true
  })
});

// Lier la mère à l'enfant
await fetch('/api/relationship', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personAId: mother.id,
    personBId: child.id,
    type: 'PARENTAL',
    isBiological: true
  })
});

// Lier les parents entre eux (optionnel)
await fetch('/api/relationship', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personAId: father.id,
    personBId: mother.id,
    type: 'UNION',
    isBiological: true
  })
});
```

---

## 🏠 Gestion de famille

### Créer une famille

```javascript
const response = await fetch('/api/family', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyName: 'Famille Dupont'
  })
});

const family = await response.json();
// L'utilisateur devient automatiquement ADMIN et ACTIVE
```

### Rechercher une famille

```javascript
const response = await fetch('/api/family/search?name=Dupont', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const families = await response.json();
// Retourne un tableau de familles avec un champ "isMember"
```

### Rejoindre une famille

```javascript
const response = await fetch('/api/family/join', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    familyId: 1,
    gender: 'M',
    relatedToPersonId: 5,
    relationshipType: 'PARENTAL'
  })
});

// Le statut sera PENDING jusqu'à validation par 3 membres
```

---

## 💡 Bonnes pratiques

### 1. Gestion des erreurs

```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### 2. Helper pour les headers

```javascript
function getAuthHeaders(token, contentType = null) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  return headers;
}

// Utilisation
fetch('/api/endpoint', {
  headers: getAuthHeaders(token, 'application/json')
});
```

### 3. Validation côté client

```javascript
function validateFile(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 5MB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Type de fichier non autorisé');
  }
  
  return true;
}
```

---

## 🔍 Débogage

### Voir les requêtes dans la console

```javascript
// Wrapper pour logger toutes les requêtes
async function fetchWithLog(url, options) {
  console.log('📤 Request:', url, options);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  console.log('📥 Response:', response.status, data);
  
  return { response, data };
}
```

### Vérifier le token

```javascript
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid token:', e);
    return null;
  }
}

// Utilisation
const payload = decodeJWT(token);
console.log('Token payload:', payload);
// { sub: 1, email: "user@example.com", iat: ..., exp: ... }
```

---

## 📚 Ressources

- **Documentation API complète** : [API_README.md](./API_README.md)
- **Guide d'installation** : [SETUP.md](./SETUP.md)
- **Changelog** : [CHANGELOG.md](./CHANGELOG.md)

---

**Dernière mise à jour** : 28 Janvier 2026
