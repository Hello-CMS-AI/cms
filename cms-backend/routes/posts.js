const express = require('express');
const router = express.Router();
const {
  createPost,
  publishPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController');

// Create a new post
router.post('/', createPost);

router.post('/publish', publishPost);

// Get all posts
router.get('/', getAllPosts);

// Get a single post by ID
router.get('/:id', getPostById);

// Update a post by ID
router.put('/:id', updatePost);

// Delete a post by ID
router.delete('/:id', deletePost);

module.exports = router;
