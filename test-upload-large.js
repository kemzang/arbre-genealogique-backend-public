// Test simple de l'endpoint upload-large
// Remplacez YOUR_TOKEN par un vrai token JWT

const testUploadLarge = async () => {
  try {
    // Créer un fichier de test (simuler un gros fichier)
    const testContent = 'A'.repeat(1024 * 1024); // 1MB de 'A'
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-large.txt', { type: 'text/plain' });

    console.log('📤 Test upload-large avec fichier de', file.size, 'bytes');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('familyId', '1');
    formData.append('mediaType', 'FILE');

    const response = await fetch('http://localhost:3001/api/media/upload-large', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN' // ← Remplacer par un vrai token
      },
      body: formData
    });

    console.log('📥 Status:', response.status);
    const data = await response.json();
    console.log('📥 Response:', data);

    if (response.ok) {
      console.log('✅ Upload réussi !');
      console.log('📁 Fichier accessible à:', `http://localhost:3001${data.urlPath}`);
    } else {
      console.error('❌ Erreur:', data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

// Pour tester dans le navigateur :
// 1. Ouvrez la console (F12)
// 2. Copiez-collez ce code
// 3. Remplacez YOUR_TOKEN par un vrai token
// 4. Exécutez : testUploadLarge()

console.log('✅ Fonction testUploadLarge() prête');
console.log('📝 Pour tester: testUploadLarge()');
