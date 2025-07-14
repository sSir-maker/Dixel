const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    cloudinaryId: {
  type: String,
  required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Référence au modèle User
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },  // Pour inclure les virtuals quand on convertit en JSON
    toObject: { virtuals: true } // Pour inclure les virtuals quand on convertit en objet
});

// Middleware pour mettre à jour la date de modification
imageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Optionnel : Virtual populate si vous voulez accéder aux infos de l'auteur
imageSchema.virtual('authorDetails', {
    ref: 'User',
    localField: 'author',
    foreignField: '_id',
    justOne: true
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;