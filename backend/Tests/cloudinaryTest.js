
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: './config/config.env' });

// Fonction pour masquer les informations sensibles
const maskSensitive = (value, visibleChars = 4) => {
  if (!value) return 'NON_CONFIGURÉ';
  return '***' + value.slice(-visibleChars);
};

console.log('\n=== DIAGNOSTIC CLOUDINARY ===\n');

// 1. Vérification des variables d'environnement
console.log('Vérification des variables d\'environnement:');
console.log('Chemin du fichier .env:', '../config/config.env');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NON_CONFIGURÉ');
console.log('API Key:', maskSensitive(process.env.CLOUDINARY_API_KEY));
console.log('API Secret:', maskSensitive(process.env.CLOUDINARY_API_SECRET));

// 2. Configuration initiale
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  console.log('\nConfiguration Cloudinary appliquée avec succès');
} catch (configError) {
  console.error('\nERREUR de configuration:', configError.message);
  process.exit(1);
}

// 3. Test de connexion
(async () => {
  console.log('\nTest de connexion à Cloudinary en cours...');
  
  try {
    const startTime = Date.now();
    const result = await cloudinary.api.ping({ timeout: 5000 });
    const responseTime = Date.now() - startTime;

    console.log('\nCONNEXION RÉUSSIE');
    console.log('Temps de réponse:', `${responseTime}ms`);
    console.log('Status:', result.status);
    console.log('Service:', result.service);

    // Test supplémentaire
    try {
      console.log('\nTest supplémentaire: liste des ressources...');
      const resources = await cloudinary.api.resources({ max_results: 1 });
      console.log('Dernière ressource trouvée:', 
        resources.resources[0]?.public_id || 'Aucune ressource');
    } catch (resourceError) {
      console.log('Test des ressources échoué (peut être normal)');
    }

  } catch (err) {
    console.error('\nÉCHEC DE CONNEXION');
    console.error('Erreur technique:', err.message);
    
    // Diagnostic
    console.log('\nDIAGNOSTIC:');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('- Cloud Name manquant');
    }
    if (!process.env.CLOUDINARY_API_KEY) {
      console.log('- API Key manquante');
    }
    if (!process.env.CLOUDINARY_API_SECRET) {
      console.log('- API Secret manquant');
    }
    
    console.log('\nSOLUTIONS POSSIBLES:');
    console.log('1. Vérifiez votre fichier .env dans config/');
    console.log('2. Vérifiez les permissions de votre compte Cloudinary');
    console.log('3. Testez votre connexion internet');
    console.log('4. Essayez de régénérer vos clés API');
    
    process.exit(1);
  }
})();