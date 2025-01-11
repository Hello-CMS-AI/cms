const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensure tag name is globally unique
      trim: true, // Remove leading and trailing whitespace
    },
    slug: {
      type: String,
      required: true,
      unique: true, // Ensure slug is unique across all tags
      trim: true, // Remove leading and trailing whitespace
    },
    description: {
      type: String,
      default: '', // Optional field for description
      trim: true, // Remove unnecessary whitespace
    },
    isDeleted: {
      type: Boolean,
      default: false, // Soft delete flag
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Index for better search performance (case-insensitive search on name and slug)
tagSchema.index({ name: 1, slug: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Static method to get all non-deleted tags
tagSchema.statics.getActiveTags = function () {
  return this.find({ isDeleted: false });
};

// Create the Tag model
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
