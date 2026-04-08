/**
 * routes/authRoutes.js - Routes d'authentification
 * Inclut les routes admin pour la gestion des utilisateurs et l'approbation des agents
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Routes protégées
router.get('/profile', verifyToken, AuthController.getProfile);

// Routes admin - Gestion des utilisateurs
router.get('/users', verifyToken, isAdmin, AuthController.getAllUsers);
router.get('/pending-agents', verifyToken, isAdmin, AuthController.getPendingAgents);
router.put('/activate/:id', verifyToken, isAdmin, AuthController.activateUser);
router.put('/deactivate/:id', verifyToken, isAdmin, AuthController.deactivateUser);
router.delete('/users/:id', verifyToken, isAdmin, AuthController.deleteUser);

module.exports = router;
