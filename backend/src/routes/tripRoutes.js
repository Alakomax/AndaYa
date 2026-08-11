const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Cotizar tarifa transparente de viaje
router.post('/estimate', tripController.estimateTrip);

module.exports = router;
