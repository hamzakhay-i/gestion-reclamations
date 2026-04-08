/**
 * models/userModel.js - Modèle de données pour les utilisateurs
 * Gère les opérations CRUD sur la table users
 */

const { getPool } = require('../config/db');

const UserModel = {
    /**
     * Créer un nouvel utilisateur
     * @param {string} name - Nom de l'utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe hashé
     * @param {string} role - Rôle (client, agent, admin)
     * @returns {Object} Résultat de l'insertion
     */
    async create(name, email, password, role = 'client') {
        const pool = getPool();
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return result;
    },

    /**
     * Trouver un utilisateur par son email
     * @param {string} email - Email à rechercher
     * @returns {Object|null} Utilisateur trouvé ou null
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
     * @param {number} id - ID de l'utilisateur
     * @returns {Object|null} Utilisateur trouvé ou null
     */
    async findById(id) {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Récupérer tous les utilisateurs (admin uniquement)
     * @returns {Array} Liste des utilisateurs
     */
    async findAll() {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }
};

module.exports = UserModel;
