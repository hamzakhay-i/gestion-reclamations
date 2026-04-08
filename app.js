/**
 * app.js - Point d'entrée principal de l'application
 * Configure Express, les middlewares et les routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import de la configuration DB et initialisation
const { initDatabase } = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const reclamationRoutes = require('./routes/reclamationRoutes');
const responseRoutes = require('./routes/responseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// Middlewares globaux
// ========================

// Activer CORS pour toutes les origines
app.use(cors());

// Parser les requêtes JSON
app.use(express.json());

// Parser les requêtes URL-encoded
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques depuis /public
app.use(express.static(path.join(__dirname, 'public')));

// Servir les vues HTML depuis /views
app.use('/views', express.static(path.join(__dirname, 'views')));

// ========================
// Routes API
// ========================

app.use('/api/auth', authRoutes);
app.use('/api/reclamations', reclamationRoutes);
app.use('/api/responses', responseRoutes);

// ========================
// Route principale - redirige vers login
// ========================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Route pour servir les pages HTML
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/reclamation', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reclamation.html'));
});

app.get('/suivi', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'suivi.html'));
});

// ========================
// Gestion des erreurs 404
// ========================

app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// ========================
// Gestion globale des erreurs
// ========================

app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({ message: 'Erreur interne du serveur' });
});

// ========================
// Démarrage du serveur
// ========================

const startServer = async () => {
    try {
        // Initialiser la base de données
        await initDatabase();
        console.log('✅ Base de données initialisée avec succès');

        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
            console.log(`📋 API disponible sur http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage:', error.message);
        process.exit(1);
    }
};

startServer();
