const express = require('express');
const router = express.Router();
const {
  processUpload,
  setCloudinaryFolder,
  handleUploadErrors,
  uploadToCloudinary
} = require('../middlewares/uploadmiddlewares');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const imageController = require('../controllers/imageController');

// Middleware de réponse standardisée
const handleResponse = (req, res, next) => {
  res.success = (data, message = 'Succès', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };

  res.error = (error) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erreur interne du serveur';

    res.status(statusCode).json({
      success: false,
      message
    });
  };

  next();
};

router.use(handleResponse);

/**
 * ROUTES PUBLIQUES
 */
router.get('/', imageController.getAllImages);
router.get('/:id', imageController.getImageById);

/**
 * ROUTES PROTÉGÉES (authentification requise)
 */
router.use(isAuthenticatedUser);

// Upload multiple
router.post(
  '/upload',
  isAuthenticatedUser,
  setCloudinaryFolder('gallery-project'),
  processUpload('images', 10),
  handleUploadErrors({ fieldName: 'images', maxFiles: 10 }),
  imageController.createImage
);

// Upload single
router.post(
  '/upload/single',
  setCloudinaryFolder('user-images'),
  handleUploadErrors({ fieldName: 'images', maxFiles: 1 }),
  uploadToCloudinary,
  imageController.createImage
);

// Mise à jour & suppression (vérification ownership incluse dans le contrôleur)
router.put('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);

/**
 * ROUTES ADMIN (authentification + autorisation)
 */
router.use(authorizeRoles('admin'));

router.get('/admin/all', imageController.getAllImagesForAdmin);
router.delete('/admin/:id', imageController.adminDeleteImage);

module.exports = router;