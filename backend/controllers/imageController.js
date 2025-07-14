const Image = require('../models/image');
const mongoose = require('mongoose');

const createImage = async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        const author = req.user._id;

        const files = req.uploadedFiles; // 🔥 PAS req.files

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        const imagesToSave = files.map(file => ({
            title: title || file.originalName.split('.')[0],
            description: description || '',
            tags: tags ? tags.split(',') : [],
            url: file.url,
            author,
            cloudinaryId: file.publicId,
            format: file.format,
            size: file.size,
            type: file.type,
        }));

        const savedImages = await Image.insertMany(imagesToSave);

        res.status(201).json({
            success: true,
            data: savedImages,
            message: `${savedImages.length} image(s) enregistrée(s)`
        });

    } catch (error) {
        console.error('Erreur lors de la création des images :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};


// Récupérer toutes les images avec pagination et filtres
const getAllImages = async (req, res) => {
    try {
        const { page = 1, limit = 10, tag } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (tag) {
            query.tags = tag;
        }

        const images = await Image.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 })
            .exec();

        const total = await Image.countDocuments(query);

        res.status(200).json({
            success: true,
            data: images,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images',
            error: error.message
        });
    }
};

// Récupérer une image par ID
const getImageById = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id.trim())
            .populate('author', 'name email avatar')
            .exec();

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: image
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'image',
            error: error.message
        });
    }
};

// Mettre à jour une image
const updateImage = async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        
        // Vérifier que l'utilisateur est bien l'auteur de l'image
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        if (image.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cette image'
            });
        }

        const updatedImage = await Image.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                tags,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('author', 'name email avatar');

        res.status(200).json({
            success: true,
            data: updatedImage,
            message: 'Image mise à jour avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'image',
            error: error.message
        });
    }
};

// Supprimer une image
const deleteImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Vérifier que l'utilisateur est bien l'auteur ou un admin
        if (image.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cette image'
            });
        }

        await Image.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Image supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image',
            error: error.message
        });
    }
};

// Recherche d'images
const searchImages = async (req, res) => {
    try {
        const { q } = req.query;
        
        const images = await Image.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        })
        .populate('author', 'name avatar')
        .limit(10);

        res.status(200).json({
            success: true,
            data: images
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche',
            error: error.message
        });
    }
};

// Vérifier la propriété d'une image
const checkOwnership = async (req, res, next) => {
    try {
        const image = await Image.findById(req.params.id);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        if (image.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Action non autorisée'
            });
        }

        req.image = image;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur de vérification de propriété',
            error: error.message
        });
    }
};

// Suppression avec Cloudinary
const deleteImageWithCloudinary = async (req, res) => {
    try {
        const { deleteFromCloudinary } = require('../middlewares/uploadmiddlewares');
        const image = req.image || await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Suppression de Cloudinary si un public_id existe
        if (image.cloudinaryId) {
            await deleteFromCloudinary(image.cloudinaryId);
        }

        // Suppression de la base de données
        await Image.findByIdAndDelete(image._id);

        res.status(200).json({
            success: true,
            message: 'Image supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image',
            error: error.message
        });
    }
};

// Version admin pour supprimer une image
const adminDeleteImage = async (req, res) => {
    try {
        const { deleteFromCloudinary } = require('../middlewares/uploadmiddlewares');
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Suppression de Cloudinary
        if (image.cloudinaryId) {
            await deleteFromCloudinary(image.cloudinaryId);
        }

        // Suppression de la base de données
        await Image.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Image supprimée (admin) avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression admin',
            error: error.message
        });
    }
};

// Récupérer toutes les images (version admin)
const getAllImagesForAdmin = async (req, res) => {
    try {
        const images = await Image.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: images
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images (admin)',
            error: error.message
        });
    }
};

// Exporter toutes les fonctions
module.exports = {
    createImage,
    getAllImages,
    getImageById,
    updateImage,
    deleteImage,
    searchImages,
    checkOwnership,
    deleteImageWithCloudinary,
    adminDeleteImage,
    getAllImagesForAdmin
};