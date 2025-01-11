// routes/images.js
const express = require('express');
const { upload, uploadImage, getImages, deleteImage, updateImageDetails } = require('../controllers/imageController');
const router = express.Router();

// Fetch all images
router.get('/', getImages);

// Upload an image
router.post('/upload', upload.single('image'), uploadImage);

// in routes/images.js
router.delete('/*', deleteImage);

// Update image details (Auto-Save)
router.put('/:imageId', updateImageDetails);

module.exports = router;
