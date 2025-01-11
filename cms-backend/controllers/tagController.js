const Tag = require('../models/tag'); // Import the Tag model

// Controller to create a new tag
const createTag = async (req, res) => {
  let { name, slug, description } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Tag name is required.' });
  }

  try {
    // Generate the slug automatically if it's not provided
    slug = slug || name.toLowerCase().replace(/ /g, "-");

    // Check if the tag name or slug already exists (case-insensitive)
    const existingTag = await Tag.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: 'i' } }, // Case-insensitive name check
        { slug: { $regex: `^${slug}$`, $options: 'i' } }, // Case-insensitive slug check
      ],
    });

    if (existingTag) {
      return res.status(400).json({
        message: 'Tag name or slug already exists. Please use a different name or slug.',
      });
    }

    // Create the new tag
    const tag = new Tag({
      name,
      slug,
      description: description || '', // Default empty string if not provided
    });

    await tag.save();

    // Respond with success
    res.status(201).json({ message: 'Tag created successfully', tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Failed to create tag' });
  }
};

// Controller to fetch all tags
const listTags = async (req, res) => {
  try {
    const tags = await Tag.find(); // Fetch all tags
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
};

// Controller to fetch a single tag by ID
const getTagById = async (req, res) => {
  const { id } = req.params;

  try {
    const tag = await Tag.findById(id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.status(200).json(tag);
  } catch (error) {
    console.error('Error fetching tag by ID:', error);
    res.status(500).json({ message: 'Failed to fetch tag' });
  }
};

// Controller to update a tag by ID
const updateTag = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Tag name is required.' });
  }

  try {
    const tag = await Tag.findById(id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Generate the slug automatically if it's not provided
    const updatedSlug = slug || name.toLowerCase().replace(/ /g, "-");

    // Check for duplicate name or slug in other tags
    const existingTag = await Tag.findOne({
      _id: { $ne: id },
      $or: [
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { slug: { $regex: `^${updatedSlug}$`, $options: 'i' } },
      ],
    });

    if (existingTag) {
      return res.status(400).json({
        message: 'Another tag with the same name or slug already exists.',
      });
    }

    // Update tag details
    tag.name = name;
    tag.slug = updatedSlug;
    tag.description = description || '';

    await tag.save();

    res.status(200).json({ message: 'Tag updated successfully', tag });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ message: 'Failed to update tag' });
  }
};

// Controller to permanently delete a tag by ID
const deleteTag = async (req, res) => {
  const { id } = req.params;

  try {
    const tag = await Tag.findById(id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Permanently delete the tag
    await Tag.findByIdAndDelete(id);

    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
};

module.exports = {
  createTag,
  listTags,
  getTagById,
  updateTag,
  deleteTag,
};
