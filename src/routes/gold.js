const express = require('express');
const router = express.Router();
const { crawlGoldPrice } = require('../services/crawlGoldPrice');

router.get('/gold-price', async (req, res) => {
  try {
    const data = await crawlGoldPrice();
    res.json(data);
  } catch (error) {
    console.error('Error in /api/gold-price endpoint:', error.message);
    res.status(500).json({
      error: 'Failed to fetch gold price',
      message: error.message,
      source: 'mihong.vn'
    });
  }
});

module.exports = router;
