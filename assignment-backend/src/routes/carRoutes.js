// routes/carRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar
} = require('../controllers/carController');
const upload = require('../config/multerConfig'); // configure multer for file upload

const router = express.Router();
router.post('/', auth, upload.array('images', 10), createCar);
router.get('/', auth, getCars);
router.get('/:id', auth, getCarById);
router.patch('/:id', auth, upload.array('images', 10), updateCar);
router.delete('/:id', auth, deleteCar);

module.exports = router;
