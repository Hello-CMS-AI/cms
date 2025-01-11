// models/Post.js

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },
  slug: { type: String, unique: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: [String] },

  // Feature image object
  featureImage: {
    url: { type: String },
    title: { type: String },
    altText: { type: String },
    caption: { type: String },
    description: { type: String },
    type: { type: String },
    format: { type: String },
  },

  // Category reference
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },

  // Tags references
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    },
  ],

  // The author's username (string snapshot)
  authorName: { type: String },

  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'trash'],
    default: 'draft',
  },
  publishedAt: { type: Date },
  scheduledAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
