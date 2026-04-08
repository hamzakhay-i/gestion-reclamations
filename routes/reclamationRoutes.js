/**
 * routes/reclamationRoutes.js - Routes des réclamations
 * Toutes les routes sont protégées par authentification JWT
 */

const express = require('express');
const router = express.Router();
const ReclamationController = require('../controllers/reclamationController');
const { verifyToken, isAdmin, isAgentOrAdmin } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// GET /api/reclamations/stats - Statistiques dashboard (admin/agent)
// IMPORTANT : cette route doit être AVANT /:id pour éviter les conflits
router.get('/stats', isAgentOrAdmin, ReclamationController.getStats);

// GET /api/reclamations - Liste des réclamations
router.get('/', ReclamationController.getAll);

// GET /api/reclamations/:id - Détail d'une réclamation
router.get('/:id', ReclamationController.getById);

// POST /api/reclamations - Créer une réclamation
router.post('/', ReclamationController.create);

// PUT /api/reclamations/:id - Modifier une réclamation
router.put('/:id', ReclamationController.update);

// DELETE /api/reclamations/:id - Supprimer une réclamation (admin)
router.delete('/:id', isAdmin, ReclamationController.delete);

module.exports = router;
