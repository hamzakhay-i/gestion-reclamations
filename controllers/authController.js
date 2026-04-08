/**
 * controllers/authController.js - Contrôleur d'authentification
 * Gère l'inscription, la connexion et le profil utilisateur
 * Les agents doivent être approuvés par l'admin avant de pouvoir se connecter
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const AuthController = {
    /**
     * Inscription d'un nouvel utilisateur
     * POST /api/auth/register
     * Les agents sont créés en mode inactif (is_active = false)
     * Seuls client et agent peuvent s'inscrire (l'admin existe par défaut)
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

            // Seuls client et agent peuvent s'inscrire (admin ne peut pas s'auto-inscrire)
            const allowedRoles = ['client', 'agent'];
            const userRole = allowedRoles.includes(role) ? role : 'client';

            // Hasher le mot de passe avec bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Créer l'utilisateur (les agents seront is_active = false)
            const result = await UserModel.create(name, email, hashedPassword, userRole);

            // Si c'est un agent, ne pas retourner de token (doit attendre l'activation)
            if (userRole === 'agent') {
                return res.status(201).json({
                    message: 'Inscription réussie. Votre compte agent est en attente d\'approbation par l\'administrateur.',
                    pending: true,
                    user: {
                        id: result.insertId,
                        name,
                        email,
                        role: userRole,
                        is_active: false
                    }
                });
            }

            // Pour les clients : générer le token JWT directement
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
                    role: userRole,
                    is_active: true
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
     * Vérifie que le compte est actif avant d'autoriser la connexion
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

            // Vérifier que le compte est actif (surtout pour les agents)
            if (!user.is_active) {
                return res.status(403).json({
                    message: 'Votre compte est en attente d\'approbation par l\'administrateur. Veuillez patienter.',
                    pending: true
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
    },

    /**
     * Récupérer les agents en attente d'activation (admin)
     * GET /api/auth/pending-agents
     */
    async getPendingAgents(req, res) {
        try {
            const agents = await UserModel.findPendingAgents();
            res.json({ agents });
        } catch (error) {
            console.error('Erreur pending agents:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Récupérer tous les utilisateurs (admin)
     * GET /api/auth/users
     */
    async getAllUsers(req, res) {
        try {
            const users = await UserModel.findAll();
            res.json({ users });
        } catch (error) {
            console.error('Erreur users:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Activer un compte agent (admin)
     * PUT /api/auth/activate/:id
     */
    async activateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await UserModel.findById(id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            await UserModel.activate(id);
            res.json({ message: `Compte de ${user.name} activé avec succès.` });
        } catch (error) {
            console.error('Erreur activation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Désactiver un compte (admin)
     * PUT /api/auth/deactivate/:id
     */
    async deactivateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await UserModel.findById(id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            // Empêcher l'admin de se désactiver lui-même
            if (user.id === req.user.id) {
                return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte.' });
            }

            await UserModel.deactivate(id);
            res.json({ message: `Compte de ${user.name} désactivé.` });
        } catch (error) {
            console.error('Erreur désactivation:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    },

    /**
     * Supprimer un utilisateur (admin)
     * DELETE /api/auth/users/:id
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await UserModel.findById(id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            if (user.id === req.user.id) {
                return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
            }

            await UserModel.delete(id);
            res.json({ message: `Utilisateur ${user.name} supprimé.` });
        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur.' });
        }
    }
};

module.exports = AuthController;
