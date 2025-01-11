// routes/trends.js
const express = require('express');
const router = express.Router();
const { fetchRelatedQueries } = require('../controllers/trendsController');

// GET /api/trends/related?keyword=car
router.get('/related', fetchRelatedQueries);

module.exports = router;
