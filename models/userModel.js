/**
 * models/userModel.js - Modèle de données pour les utilisateurs
 * Gère les opérations CRUD sur la table users
 * Inclut la gestion du statut actif/inactif pour les agents
 */

const { getPool } = require('../config/db');

const UserModel = {
    /**
     * Créer un nouvel utilisateur
     * Les agents sont créés avec is_active = false (en attente d'activation par l'admin)
     * Les clients et admins sont actifs par défaut
     */
    async create(name, email, password, role = 'client') {
        const pool = getPool();
        const isActive = role === 'agent' ? false : true;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, isActive]
        );
        return result;
    },

    /**
     * Trouver un utilisateur par son email
     */
    async findByEmail(email) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    },

    /**
     * Trouver un utilisateur par son ID
     */
    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Récupérer tous les utilisateurs (admin uniquement)
     */
    async findAll() {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    },

    /**
     * Récupérer les agents en attente d'activation
     */
    async findPendingAgents() {
        const pool = getPool();
        const [rows] = await pool.execute(
            "SELECT id, name, email, role, is_active, created_at FROM users WHERE role = 'agent' AND is_active = FALSE ORDER BY created_at DESC"
        );
        return rows;
    },

    /**
     * Activer un compte utilisateur (admin approuve un agent)
     */
    async activate(id) {
        const pool = getPool();
        const [result] = await pool.execute(
            'UPDATE users SET is_active = TRUE WHERE id = ?',
            [id]
        );
        return result;
    },

    /**
     * Désactiver un compte utilisateur
     */
    async deactivate(id) {
        const pool = getPool();
        const [result] = await pool.execute(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return result;
    },

    /**
     * Supprimer un utilisateur
     */
    async delete(id) {
        const pool = getPool();
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result;
    }
};

module.exports = UserModel;
