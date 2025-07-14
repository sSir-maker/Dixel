const ImageAccessService = require('../services/imageAccessService');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncErrors');

exports.checkImageAccess = (requiredPermission = 'view') => 
  catchAsyncErrors(async (req, res, next) => {
    const token = req.query.token || req.headers['x-image-token'];
    
    if (!token) {
      return next(new ErrorHandler('Token d\'accès requis', 401));
    }

    try {
      const { image, permissions } = await ImageAccessService.verifyAccessKey(token);
      
      if (!permissions.includes(requiredPermission)) {
        return next(new ErrorHandler('Permissions insuffisantes', 403));
      }

      // Ajouter l'image et les permissions à la requête
      req.image = image;
      req.imagePermissions = permissions;
      next();
    } catch (error) {
      return next(error);
    }
  });