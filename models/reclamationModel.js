/**
 * models/reclamationModel.js - Modèle de données pour les réclamations
 * Gère les opérations CRUD sur la table reclamations
 */

const { getPool } = require('../config/db');

const ReclamationModel = {
    /**
     * Créer une nouvelle réclamation
     * @param {string} title - Titre de la réclamation
     * @param {string} description - Description détaillée
     * @param {string} priority - Priorité (normale, urgente)
     * @param {number} userId - ID de l'utilisateur créateur
     * @returns {Object} Résultat de l'insertion
     */
    async create(title, description, priority, userId) {
        const pool = getPool();
        const [result] = await pool.execute(
            'INSERT INTO reclamations (title, description, priority, user_id) VALUES (?, ?, ?, ?)',
            [title, description, priority, userId]
        );
        return result;
    },

    /**
     * Récupérer toutes les réclamations (admin/agent)
     * Inclut le nom de l'utilisateur créateur
     * @returns {Array} Liste de toutes les réclamations
     */
    async findAll() {
        const pool = getPool();
        const [rows] = await pool.execute(`
            SELECT r.*, u.name as user_name, u.email as user_email
            FROM reclamations r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        return rows;
    },

    /**
     * Récupérer les réclamations d'un utilisateur spécifique (client)
     * @param {number} userId - ID de l'utilisateur
     * @returns {Array} Liste des réclamations de l'utilisateur
     */
    async findByUserId(userId) {
        const pool = getPool();
        const [rows] = await pool.execute(`
            SELECT r.*, u.name as user_name
            FROM reclamations r
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [userId]);
        return rows;
    },

    /**
     * Trouver une réclamation par son ID
     * @param {number} id - ID de la réclamation
     * @returns {Object|null} Réclamation trouvée ou null
     */
    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.execute(`
            SELECT r.*, u.name as user_name, u.email as user_email
            FROM reclamations r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    },

    /**
     * Mettre à jour le statut d'une réclamation
     * @param {number} id - ID de la réclamation
     * @param {string} status - Nouveau statut (ouverte, en_cours, traitée)
     * @returns {Object} Résultat de la mise à jour
     */
    async updateStatus(id, status) {
        const pool = getPool();
        const [result] = await pool.execute(
            'UPDATE reclamations SET status = ? WHERE id = ?',
            [status, id]
        );
        return result;
    },

    /**
     * Mettre à jour une réclamation (titre, description, priorité, statut)
     * @param {number} id - ID de la réclamation
     * @param {Object} data - Données à mettre à jour
     * @returns {Object} Résultat de la mise à jour
     */
    async update(id, data) {
        const pool = getPool();
        const fields = [];
        const values = [];

        if (data.title) { fields.push('title = ?'); values.push(data.title); }
        if (data.description) { fields.push('description = ?'); values.push(data.description); }
        if (data.priority) { fields.push('priority = ?'); values.push(data.priority); }
        if (data.status) { fields.push('status = ?'); values.push(data.status); }

        if (fields.length === 0) return null;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE reclamations SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    },

    /**
     * Supprimer une réclamation
     * @param {number} id - ID de la réclamation
     * @returns {Object} Résultat de la suppression
     */
    async delete(id) {
        const pool = getPool();
        const [result] = await pool.execute(
            'DELETE FROM reclamations WHERE id = ?',
            [id]
        );
        return result;
    },

    /**
     * Obtenir les statistiques des réclamations pour le dashboard
     * @returns {Object} Compteurs par statut
     */
    async getStats() {
        const pool = getPool();
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ouverte' THEN 1 ELSE 0 END) as ouvertes,
                SUM(CASE WHEN status = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
                SUM(CASE WHEN status = 'traitée' THEN 1 ELSE 0 END) as traitees
            FROM reclamations
        `);
        return rows[0];
    }
};

module.exports = ReclamationModel;
