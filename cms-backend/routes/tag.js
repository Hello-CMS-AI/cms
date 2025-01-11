const express = require('express');
const { createTag, getTagById, updateTag, deleteTag } = require('../controllers/tagController'); // Import the required controllers
const router = express.Router();
const Tag = require('../models/tag'); // Import the Tag model

// Route to create a new tag
router.post('/add-tag', createTag);

// Route to get all tags
router.get('/list-tags', async (req, res) => {
  try {
    const tags = await Tag.find(); // Fetch all tags from the database
    res.status(200).json(tags); // Send the tags as JSON response
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

// Route to get a tag by ID
router.get('/:id', getTagById);

// Route to update a tag by ID
router.put('/update-tag/:id', updateTag);

router.delete('/delete-tag/:id', deleteTag);

module.exports = router;

