/**
 * controllers/responseController.js - Contrôleur des réponses
 * Gère l'ajout et la consultation des réponses aux réclamations
 */

const ResponseModel = require('../models/responseModel');
const ReclamationModel = require('../models/reclamationModel');

const ResponseController = {
    /**
     * Ajouter une réponse à une réclamation
     * POST /api/responses
     */
    async create(req, res) {
        try {
            const { message, reclamation_id } = req.body;
            const userId = req.user.id;

            // Validation des champs requis
            if (!message || !reclamation_id) {
                return res.status(400).json({
                    message: 'Le message et l\'ID de la réclamation sont requis.'
                });
            }

            // Vérifier que la réclamation existe
            const reclamation = await ReclamationModel.findById(reclamation_id);
            if (!reclamation) {
                return res.status(404).json({
                    message: 'Réclamation non trouvée.'
                });
            }

            // Créer la réponse
            const result = await ResponseModel.create(message, reclamation_id, userId);

            // Si c'est la première réponse d'un agent/admin, passer le statut en "en_cours"
            if ((req.user.role === 'agent' || req.user.role === 'admin') 
                && reclamation.status === 'ouverte') {
                await ReclamationModel.updateStatus(reclamation_id, 'en_cours');
            }

            res.status(201).json({
                message: 'Réponse ajoutée avec succès.',
                response: {
                    id: result.insertId,
                    message,
                    reclamation_id,
                    user_id: userId
                }
            });
        } catch (error) {
            console.error('Erreur création réponse:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Récupérer toutes les réponses d'une réclamation
     * GET /api/responses/:reclamation_id
     */
    async getByReclamation(req, res) {
        try {
            const { reclamation_id } = req.params;

            // Vérifier que la réclamation existe
            const reclamation = await ReclamationModel.findById(reclamation_id);
            if (!reclamation) {
                return res.status(404).json({
                    message: 'Réclamation non trouvée.'
                });
            }

            // Les clients ne peuvent voir que les réponses de leurs propres réclamations
            if (req.user.role === 'client' && reclamation.user_id !== req.user.id) {
                return res.status(403).json({
                    message: 'Accès non autorisé.'
                });
            }

            const responses = await ResponseModel.findByReclamationId(reclamation_id);

            res.json({ responses });
        } catch (error) {
            console.error('Erreur récupération réponses:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    }
};

module.exports = ResponseController;
