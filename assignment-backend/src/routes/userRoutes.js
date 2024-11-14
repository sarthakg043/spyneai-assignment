// routes/userRoutes.js
const express = require('express');
const { signup, login, getProfile,  updateProfile} = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
// User profile routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router;
