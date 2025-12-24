const express = require('express');
const router = express.Router();
const { crawlSilverPrice } = require('../services/crawlSilverPrice');

/**
 * GET /api/silver-price
 * Crawls giabac.vn and returns current silver price
 */
router.get('/silver-price', async (req, res) => {
  try {
    const data = await crawlSilverPrice();
    res.json(data);
  } catch (error) {
    console.error('Error in /api/silver-price endpoint:', error.message);
    res.status(500).json({
      error: 'Failed to fetch silver price',
      message: error.message,
      source: 'giabac.vn'
    });
  }
});

module.exports = router;

