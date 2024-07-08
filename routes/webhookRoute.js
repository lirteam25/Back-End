const express = require('express');
const webhookController = require('../controllers/webhookController');
const router = express.Router();

router.post('/crossmint', webhookController.crossmintWebhook);

module.exports = router;
