// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, default: '' },
  url: { type: String, required: true }, // e.g., "/uploads/1630549200000-originalName.jpg"
  size: { type: Number, required: true },
  dimensions: { type: String, default: null }, // e.g., "1920x1080" for images/videos
  format: { type: String, required: true }, // e.g., "jpg", "png", "mp4", "pdf"
  type: { type: String, required: true, enum: ['image', 'video', 'audio', 'document'] }, // New Field
  altText: { type: String, default: null }, // Applicable for images
  caption: { type: String, default: null },
  description: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
