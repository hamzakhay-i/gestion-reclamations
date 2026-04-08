/**
 * controllers/reclamationController.js - Contrôleur des réclamations
 * Gère le CRUD des réclamations et les statistiques du dashboard
 */

const ReclamationModel = require('../models/reclamationModel');

const ReclamationController = {
    /**
     * Créer une nouvelle réclamation
     * POST /api/reclamations
     */
    async create(req, res) {
        try {
            const { title, description, priority } = req.body;
            const userId = req.user.id;

            // Validation des champs requis
            if (!title || !description) {
                return res.status(400).json({
                    message: 'Le titre et la description sont requis.'
                });
            }

            // Valider la priorité
            const validPriorities = ['normale', 'urgente'];
            const reclamationPriority = validPriorities.includes(priority) ? priority : 'normale';

            // Créer la réclamation
            const result = await ReclamationModel.create(
                title, description, reclamationPriority, userId
            );

            res.status(201).json({
                message: 'Réclamation créée avec succès.',
                reclamation: {
                    id: result.insertId,
                    title,
                    description,
                    priority: reclamationPriority,
                    status: 'ouverte',
                    user_id: userId
                }
            });
        } catch (error) {
            console.error('Erreur création réclamation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Récupérer les réclamations
     * GET /api/reclamations
     * Admin/Agent : toutes les réclamations
     * Client : seulement ses propres réclamations
     */
    async getAll(req, res) {
        try {
            let reclamations;

            if (req.user.role === 'admin' || req.user.role === 'agent') {
                // Admin et Agent voient toutes les réclamations
                reclamations = await ReclamationModel.findAll();
            } else {
                // Client voit seulement ses réclamations
                reclamations = await ReclamationModel.findByUserId(req.user.id);
            }

            res.json({ reclamations });
        } catch (error) {
            console.error('Erreur récupération réclamations:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Récupérer une réclamation par ID
     * GET /api/reclamations/:id
     */
    async getById(req, res) {
        try {
            const reclamation = await ReclamationModel.findById(req.params.id);

            if (!reclamation) {
                return res.status(404).json({ message: 'Réclamation non trouvée.' });
            }

            // Le client ne peut voir que ses propres réclamations
            if (req.user.role === 'client' && reclamation.user_id !== req.user.id) {
                return res.status(403).json({ message: 'Accès non autorisé.' });
            }

            res.json({ reclamation });
        } catch (error) {
            console.error('Erreur récupération réclamation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Mettre à jour une réclamation
     * PUT /api/reclamations/:id
     * Admin/Agent : peut modifier statut
     * Client : peut modifier titre/description/priorité si encore ouverte
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { title, description, priority, status } = req.body;

            // Vérifier que la réclamation existe
            const reclamation = await ReclamationModel.findById(id);
            if (!reclamation) {
                return res.status(404).json({ message: 'Réclamation non trouvée.' });
            }

            // Construire les données de mise à jour selon le rôle
            const updateData = {};

            if (req.user.role === 'admin' || req.user.role === 'agent') {
                // Agent/Admin peut changer le statut
                if (status) updateData.status = status;
                if (priority) updateData.priority = priority;
            }

            if (req.user.role === 'client') {
                // Le client ne peut modifier que ses propres réclamations ouvertes
                if (reclamation.user_id !== req.user.id) {
                    return res.status(403).json({ message: 'Accès non autorisé.' });
                }
                if (reclamation.status !== 'ouverte') {
                    return res.status(400).json({
                        message: 'Impossible de modifier une réclamation en cours de traitement.'
                    });
                }
                if (title) updateData.title = title;
                if (description) updateData.description = description;
                if (priority) updateData.priority = priority;
            }

            if (req.user.role === 'admin') {
                // L'admin peut tout modifier
                if (title) updateData.title = title;
                if (description) updateData.description = description;
            }

            // Effectuer la mise à jour
            await ReclamationModel.update(id, updateData);
            const updated = await ReclamationModel.findById(id);

            res.json({
                message: 'Réclamation mise à jour avec succès.',
                reclamation: updated
            });
        } catch (error) {
            console.error('Erreur mise à jour réclamation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Supprimer une réclamation
     * DELETE /api/reclamations/:id
     * Réservé à l'admin
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que la réclamation existe
            const reclamation = await ReclamationModel.findById(id);
            if (!reclamation) {
                return res.status(404).json({ message: 'Réclamation non trouvée.' });
            }

            await ReclamationModel.delete(id);

            res.json({ message: 'Réclamation supprimée avec succès.' });
        } catch (error) {
            console.error('Erreur suppression réclamation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Obtenir les statistiques pour le dashboard admin
     * GET /api/reclamations/stats
     */
    async getStats(req, res) {
        try {
            const stats = await ReclamationModel.getStats();
            res.json({ stats });
        } catch (error) {
            console.error('Erreur statistiques:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    }
};

module.exports = ReclamationController;
