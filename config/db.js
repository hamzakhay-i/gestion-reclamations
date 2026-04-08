/**
 * config/db.js - Configuration et connexion à la base de données MySQL
 * Utilise mysql2 avec support des promesses (async/await)
 */

const mysql = require('mysql2/promise');

// Configuration de la connexion MySQL
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reclamations_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de connexions pour de meilleures performances
let pool;

/**
 * Obtenir le pool de connexions
 * @returns {Pool} Pool de connexions MySQL
 */
const getPool = () => {
    if (!pool) {
        pool = mysql.createPool(DB_CONFIG);
    }
    return pool;
};

/**
 * Initialiser la base de données et créer les tables si elles n'existent pas
 */
const initDatabase = async () => {
    // Connexion sans spécifier de base de données pour la créer
    const connection = await mysql.createConnection({
        host: DB_CONFIG.host,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password
    });

    // Créer la base de données si elle n'existe pas
    await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    // Utiliser la base de données
    await connection.changeUser({ database: DB_CONFIG.database });

    // Créer la table users
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('client', 'agent', 'admin') DEFAULT 'client',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Créer la table reclamations
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS reclamations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            priority ENUM('normale', 'urgente') DEFAULT 'normale',
            status ENUM('ouverte', 'en_cours', 'traitée') DEFAULT 'ouverte',
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Créer la table responses
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT NOT NULL,
            reclamation_id INT NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reclamation_id) REFERENCES reclamations(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await connection.end();
    console.log('📦 Tables créées / vérifiées avec succès');
};

module.exports = { getPool, initDatabase };
