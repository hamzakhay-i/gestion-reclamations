/**
 * routes/authRoutes.js - Routes d'authentification
 * POST /api/auth/register - Inscription
 * POST /api/auth/login - Connexion
 * GET /api/auth/profile - Profil (protégé)
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Routes protégées
router.get('/profile', verifyToken, AuthController.getProfile);

module.exports = router;
