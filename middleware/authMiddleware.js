/**
 * middleware/authMiddleware.js - Middleware d'authentification et d'autorisation
 * Vérifie le JWT et les rôles des utilisateurs
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sgr_secret_key_2024_reclamations';

/**
 * Vérifier le token JWT dans les headers
 * Attache les données utilisateur à req.user
 */
const verifyToken = (req, res, next) => {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

/**
 * Vérifier que l'utilisateur est un administrateur
 */
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }
    next();
};

/**
 * Vérifier que l'utilisateur est un agent
 */
const isAgent = (req, res, next) => {
    if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Accès réservé aux agents.' });
    }
    next();
};

/**
 * Vérifier que l'utilisateur est un agent ou un administrateur
 */
const isAgentOrAdmin = (req, res, next) => {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux agents et administrateurs.' });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isAgent, isAgentOrAdmin, JWT_SECRET };
