// models/ImageAccessKey.js
const mongoose = require('mongoose');

const imageAccessKeySchema = new mongoose.Schema({
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  permissions: {
    type: [String],
    enum: ['view', 'download', 'share', 'delete'],
    default: ['view']
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Auto-suppression après 7 jours
  },
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
});

imageAccessKeySchema.index({ image: 1, user: 1 });
imageAccessKeySchema.index({ tokenHash: 1 }, { unique: true });

module.exports = mongoose.model('ImageAccessKey', imageAccessKeySchema);