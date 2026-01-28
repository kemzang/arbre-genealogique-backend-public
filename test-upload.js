// Test de l'endpoint upload avec un fichier de test
const fs = require('fs');
const path = require('path');

async function testUpload() {
  // Créer un fichier de test
  const testFilePath = path.join(__dirname, 'test-image.txt');
  fs.writeFileSync(testFilePath, 'This is a test file content');

  try {
    // Lire le fichier
    const fileBuffer = fs.readFileSync(testFilePath);
    const blob = new Blob([fileBuffer], { type: 'text/plain' });
    const file = new File([blob], 'test-image.txt', { type: 'text/plain' });

    // Créer le FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('familyId', '1');
    formData.append('mediaType', 'FILE');

    console.log('📤 Envoi du fichier...');

    // Envoyer la requête
    const response = await fetch('http://localhost:3001/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Remplacer par un vrai token
      },
      body: formData
    });

    console.log('📥 Status:', response.status);
    const data = await response.json();
    console.log('📥 Response:', data);

    // Nettoyer
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testUpload();
