const express = require('express');
const { getClinics } = require('../controllers/placeController');

const router = express.Router();

router.get('/clinics', getClinics);

module.exports = router;
