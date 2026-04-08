/**
 * models/responseModel.js - Modèle de données pour les réponses
 * Gère les opérations sur la table responses
 */

const { getPool } = require('../config/db');

const ResponseModel = {
    /**
     * Créer une nouvelle réponse à une réclamation
     * @param {string} message - Contenu de la réponse
     * @param {number} reclamationId - ID de la réclamation
     * @param {number} userId - ID de l'auteur de la réponse
     * @returns {Object} Résultat de l'insertion
     */
    async create(message, reclamationId, userId) {
        const pool = getPool();
        const [result] = await pool.execute(
            'INSERT INTO responses (message, reclamation_id, user_id) VALUES (?, ?, ?)',
            [message, reclamationId, userId]
        );
        return result;
    },

    /**
     * Récupérer toutes les réponses d'une réclamation
     * Inclut le nom et le rôle de l'auteur
     * @param {number} reclamationId - ID de la réclamation
     * @returns {Array} Liste des réponses
     */
    async findByReclamationId(reclamationId) {
        const pool = getPool();
        const [rows] = await pool.execute(`
            SELECT r.*, u.name as user_name, u.role as user_role
            FROM responses r
            JOIN users u ON r.user_id = u.id
            WHERE r.reclamation_id = ?
            ORDER BY r.created_at ASC
        `, [reclamationId]);
        return rows;
    },

    /**
     * Compter les réponses pour une réclamation
     * @param {number} reclamationId - ID de la réclamation
     * @returns {number} Nombre de réponses
     */
    async countByReclamationId(reclamationId) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM responses WHERE reclamation_id = ?',
            [reclamationId]
        );
        return rows[0].count;
    }
};

module.exports = ResponseModel;
