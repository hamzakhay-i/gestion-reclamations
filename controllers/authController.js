/**
 * controllers/authController.js - Contrôleur d'authentification
 * Gère l'inscription, la connexion et le profil utilisateur
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const AuthController = {
    /**
     * Inscription d'un nouvel utilisateur
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { name, email, password, role } = req.body;

            // Validation des champs requis
            if (!name || !email || !password) {
                return res.status(400).json({
                    message: 'Tous les champs sont requis (name, email, password).'
                });
            }

            // Vérifier si l'email existe déjà
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    message: 'Cet email est déjà utilisé.'
                });
            }

            // Valider le rôle
            const validRoles = ['client', 'agent', 'admin'];
            const userRole = validRoles.includes(role) ? role : 'client';

            // Hasher le mot de passe avec bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Créer l'utilisateur
            const result = await UserModel.create(name, email, hashedPassword, userRole);

            // Générer le token JWT
            const token = jwt.sign(
                { id: result.insertId, email, role: userRole },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Inscription réussie.',
                token,
                user: {
                    id: result.insertId,
                    name,
                    email,
                    role: userRole
                }
            });
        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
        }
    },

    /**
     * Connexion d'un utilisateur existant
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validation des champs
            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email et mot de passe requis.'
                });
            }

            // Trouver l'utilisateur par email
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    message: 'Email ou mot de passe incorrect.'
                });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    message: 'Email ou mot de passe incorrect.'
                });
            }

            // Générer le token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Connexion réussie.',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
        }
    },

    /**
     * Récupérer le profil de l'utilisateur connecté
     * GET /api/auth/profile
     */
    async getProfile(req, res) {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }
            res.json({ user });
        } catch (error) {
            console.error('Erreur profil:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    }
};

module.exports = AuthController;
