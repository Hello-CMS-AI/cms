const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  description: { type: String, default: '' }, // Meta description
  keywords: { type: String, default: '' }, // Meta tags
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
