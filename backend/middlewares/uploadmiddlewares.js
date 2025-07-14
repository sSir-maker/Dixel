const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ErrorHandler = require('../utils/errorHandler');

require('dotenv').config({ path: './config/config.env' });

// Créer le dossier 'uploads/' s’il n’existe pas
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Types MIME valides
const validMimeTypes = {
  'image/jpeg': { ext: '.jpeg', type: 'image' },
  'image/png': { ext: '.png', type: 'image' },
  'image/webp': { ext: '.webp', type: 'image' },
};

// Stockage temporaire local
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (validMimeTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new ErrorHandler(`Type de fichier non supporté: ${file.mimetype}`, 415), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10
  }
});

// Upload à Cloudinary
const uploadToCloudinary = async (filePath, filename, folder, resource_type) => {
  return cloudinary.uploader.upload(filePath, {
    folder,
    public_id: `${filename}-${Date.now()}`,
    resource_type,
    transformation: [{ width: 1000, crop: 'limit' }],
    quality: 'auto:good'
  });
};

// Middleware principal : uploader local + envoyer sur Cloudinary
const handleCloudinaryUpload = (fieldName, maxFiles = 1) => {
  const uploadMiddleware = maxFiles > 1
    ? upload.array(fieldName, maxFiles)
    : upload.single(fieldName);

  return (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        const errorMap = {
          LIMIT_FILE_SIZE: 'Fichier trop volumineux (max 10MB)',
          LIMIT_FILE_COUNT: `Maximum ${maxFiles} fichiers autorisés`,
          LIMIT_UNEXPECTED_FILE: `Nom de champ incorrect. Utilisez: ${fieldName}`
        };

        const message = errorMap[err.code] || `Erreur d'upload: ${err.message}`;
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return next(new ErrorHandler(message, status));
      }

      const files = req.files || (req.file ? [req.file] : []);
      if (!files.length) {
        return next(new ErrorHandler(`Aucun fichier reçu dans le champ '${fieldName}'`, 400));
      }

      try {
        const uploads = await Promise.all(files.map(async (file) => {
          const { mimetype, path: filePath, originalname, size } = file;
          const fileInfo = validMimeTypes[mimetype] || { type: 'auto' };
          const folder = req.cloudinaryFolder || 'gallery-project';
          const filename = path.basename(originalname, path.extname(originalname));

          const result = await uploadToCloudinary(filePath, filename, folder, fileInfo.type);
          await fs.unlink(filePath); // Supprimer le fichier temporaire

          return {
            originalName: originalname,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size,
            type: fileInfo.type
          };
        }));

        req.uploadedFiles = uploads; // Important pour le contrôleur
        next();
      } catch (error) {
        return next(new ErrorHandler(`Erreur Cloudinary: ${error.message}`, 500));
      }
    });
  };
};

// Middleware pour définir le dossier Cloudinary dynamiquement
const setCloudinaryFolder = (folderName) => (req, res, next) => {
  req.cloudinaryFolder = folderName;
  next();
};

// Suppression Cloudinary
const deleteFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds)) publicIds = [publicIds];
  try {
    const results = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'auto',
      invalidate: true
    });

    return {
      success: Object.values(results.deleted).every(status => status === 'deleted'),
      details: results.deleted
    };
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    return { success: false, error: error.message };
  }
};

// Middleware d’erreur personnalisable
const handleUploadErrors = (options = {}) => {
  return (err, req, res, next) => {
    try {
      if (err) {
        const errorMap = {
          LIMIT_FILE_SIZE: `Fichier trop volumineux (max ${options.maxSize || '10MB'})`,
          LIMIT_FILE_COUNT: `Trop de fichiers (max ${options.maxFiles || '10'})`,
          LIMIT_UNEXPECTED_FILE: `Champ de fichier invalide (attendu: ${options.fieldName || 'images'})`,
        };

        const message = errorMap[err.code] || err.message || 'Erreur d\'upload';
        const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(statusCode).json({
          success: false,
          message
        });
      }

      next();
    } catch (e) {
      console.error('Erreur dans handleUploadErrors:', e);
      res.status(500).json({
        success: false,
        message: 'Erreur interne lors du traitement de l\'upload'
      });
    }
  };
};

module.exports = {
  handleCloudinaryUpload,
  deleteFromCloudinary,
  setCloudinaryFolder,
  uploadToCloudinary: handleCloudinaryUpload, // alias
  processUpload: handleCloudinaryUpload,     // alias
  handleUploadErrors
};
