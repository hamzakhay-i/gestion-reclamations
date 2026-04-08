/**
 * routes/responseRoutes.js - Routes des réponses aux réclamations
 * Toutes les routes sont protégées par authentification JWT
 */

const express = require('express');
const router = express.Router();
const ResponseController = require('../controllers/responseController');
const { verifyToken } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// POST /api/responses - Ajouter une réponse
router.post('/', ResponseController.create);

// GET /api/responses/:reclamation_id - Réponses d'une réclamation
router.get('/:reclamation_id', ResponseController.getByReclamation);

module.exports = router;
