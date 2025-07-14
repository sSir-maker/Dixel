const crypto = require('crypto');
const mongoose = require('mongoose');
const ErrorHandler = require('./errorHandler');
const ImageAccessKey = require('../models/ImageAccessKey');

// Durée de validité par défaut (10 minutes)
const DEFAULT_EXPIRATION = 600; 

/**
 * Génère une clé d'accès sécurisée pour une image
 */
exports.generateAccessKey = async (imageId, userId, options = {}) => {
    const {
        expiresIn = DEFAULT_EXPIRATION,
        permissions = ['view'],
        maxUsage = null
    } = options;

    // Validation de l'image
    const Image = mongoose.model('Image');
    if (!await Image.exists({ _id: imageId })) {
        throw new ErrorHandler('Image non trouvée', 404);
    }

    // Génération du token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Création en base
    const accessKey = await ImageAccessKey.create({
        image: imageId,
        user: userId,
        tokenHash,
        permissions,
        expiresAt,
        maxUsage
    });

    return {
        token: `${rawToken}.${imageId}`, // Format: token.imageId
        expiresAt,
        permissions
    };
};

/**
 * Vérifie et valide un token d'accès
 */
exports.verifyAccessKey = async (tokenWithImageId) => {
    const [rawToken, imageId] = tokenWithImageId.split('.');
    
    if (!rawToken || !imageId) {
        throw new ErrorHandler('Format de token invalide', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const accessKey = await ImageAccessKey.findOneAndUpdate(
        { tokenHash, image: imageId },
        { 
            $inc: { usageCount: 1 },
            $set: { lastUsedAt: new Date() }
        },
        { new: true }
    ).populate('image user');

    if (!accessKey) {
        throw new ErrorHandler('Accès non autorisé', 403);
    }

    if (accessKey.expiresAt < new Date()) {
        throw new ErrorHandler('Token expiré', 403);
    }

    if (accessKey.maxUsage && accessKey.usageCount > accessKey.maxUsage) {
        throw new ErrorHandler('Limite d\'utilisation atteinte', 403);
    }

    return {
        image: accessKey.image,
        user: accessKey.user,
        permissions: accessKey.permissions
    };
};

/**
 * Révoque tous les accès pour une image et un utilisateur
 */
exports.revokeAccessKeys = async (imageId, userId) => {
    await ImageAccessKey.deleteMany({
        image: imageId,
        user: userId
    });
};

/**
 * Middleware de vérification d'accès
 */
exports.checkImageAccess = (requiredPermission = 'view') => {
    return async (req, res, next) => {
        try {
            const token = req.query.token || req.headers['x-image-token'];
            
            if (!token) {
                return next(new ErrorHandler('Token requis', 401));
            }

            const { image, permissions } = await exports.verifyAccessKey(token);
            
            if (!permissions.includes(requiredPermission)) {
                return next(new ErrorHandler('Permissions insuffisantes', 403));
            }

            req.image = image;
            req.imagePermissions = permissions;
            next();
        } catch (error) {
            next(error);
        }
    };
};