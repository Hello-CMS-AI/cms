const Category = require('../models/category');

// Controller to create a new category
const createCategory = async (req, res) => {
  let { name, slug, parentCategory, description, keywords } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    // Always convert slug to lowercase
    slug = (slug || (parentCategory 
      ? `${name.toLowerCase().replace(/ /g, "-")}-${(await Category.findById(parentCategory)).name.toLowerCase().replace(/ /g, "-")}` 
      : name.toLowerCase().replace(/ /g, "-"))).toLowerCase();

    // Check slug uniqueness for child categories (parentCategory must not be null)
    const existingSlug = await Category.findOne({ 
      slug: { $regex: `^${slug}$`, $options: 'i' },  // Case-insensitive slug match
      parentCategory: { $ne: null }  // Check for child categories only (parentCategory should not be null)
    });

    if (existingSlug) {
      return res.status(400).json({ message: 'Slug already exists for a child category.' });
    }

    // Check if the selected parent category exists (only for child categories)
    if (parentCategory && parentCategory !== 'none') {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ message: 'Selected parent category does not exist.' });
      }
    }

    // Create the new category
    const category = new Category({
      name,
      slug,
      parentCategory: parentCategory && parentCategory !== 'none' ? parentCategory : null,
      description: description || '', // Default empty string if not provided
      keywords: keywords || '', // Default empty string if not provided
    });

    await category.save();

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// Controller to fetch all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Controller to fetch a category by ID
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Failed to fetch category details' });
  }
};

// Controller to update a category by ID
const updateCategory = async (req, res) => {
  const { id } = req.params;
  let { name, slug, parentCategory, description, keywords } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Always convert slug to lowercase
    slug = (slug || (parentCategory 
      ? `${name.toLowerCase().replace(/ /g, "-")}-${(await Category.findById(parentCategory)).name.toLowerCase().replace(/ /g, "-")}` 
      : name.toLowerCase().replace(/ /g, "-"))).toLowerCase();

    // Check slug uniqueness (case-insensitive), excluding the current category
    const existingSlug = await Category.findOne({ slug: { $regex: `^${slug}$`, $options: 'i' }, _id: { $ne: id } });
    if (existingSlug) {
      return res.status(400).json({ message: 'Slug already exists. Please use a different name or slug.' });
    }

    // Check name uniqueness (case-insensitive), excluding the current category
    const existingName = await Category.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' }, 
      parentCategory: parentCategory === "none" ? null : parentCategory,
      _id: { $ne: id }
    });
    if (existingName) {
      return res.status(400).json({ message: 'Category name must be unique within this parent category.' });
    }

    // Validate parent category if provided
    if (parentCategory && parentCategory !== 'none') {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ message: 'Selected parent category does not exist.' });
      }
    }

    // Update category fields
    category.name = name;
    category.slug = slug;
    category.parentCategory = parentCategory === "none" ? null : parentCategory; // Handle "none" as null
    category.description = description || category.description; // Keep existing description if not provided
    category.keywords = keywords || category.keywords; // Keep existing keywords if not provided

    await category.save(); // Save the updated category

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory };