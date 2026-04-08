/**
 * public/js/utils.js - Utilitaires partagés pour le frontend
 * Gère l'authentification côté client, les appels API et les fonctions communes
 */

// URL de base de l'API
const API_BASE = '/api';

/**
 * Récupérer le token JWT stocké
 * @returns {string|null} Token JWT ou null
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Récupérer les informations utilisateur stockées
 * @returns {Object|null} Données utilisateur ou null
 */
function getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Sauvegarder les données d'authentification
 * @param {string} token - Token JWT
 * @param {Object} user - Données utilisateur
 */
function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Déconnecter l'utilisateur
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

/**
 * Vérifier si l'utilisateur est connecté, sinon rediriger
 */
function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

/**
 * Construire les headers d'autorisation pour les requêtes API
 * @returns {Object} Headers avec le token Bearer
 */
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

/**
 * Effectuer une requête API avec gestion d'erreurs
 * @param {string} endpoint - Endpoint de l'API (ex: /auth/login)
 * @param {Object} options - Options de la requête fetch
 * @returns {Object} Réponse JSON de l'API
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...authHeaders(),
                ...options.headers
            }
        });

        const data = await response.json();

        // Si le token est invalide, déconnecter
        if (response.status === 401 || response.status === 403) {
            if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                logout();
                return null;
            }
        }

        if (!response.ok) {
            throw new Error(data.message || 'Erreur de requête');
        }

        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

/**
 * Formater une date ISO en format lisible
 * @param {string} dateStr - Date ISO
 * @returns {string} Date formatée
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Obtenir le badge HTML pour un statut de réclamation
 * @param {string} status - Statut (ouverte, en_cours, traitée)
 * @returns {string} HTML du badge
 */
function getStatusBadge(status) {
    const badges = {
        'ouverte': '<span class="badge bg-warning text-dark"><i class="bi bi-circle-fill me-1"></i>Ouverte</span>',
        'en_cours': '<span class="badge bg-info"><i class="bi bi-arrow-repeat me-1"></i>En cours</span>',
        'traitée': '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>Traitée</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * Obtenir le badge HTML pour une priorité
 * @param {string} priority - Priorité (normale, urgente)
 * @returns {string} HTML du badge
 */
function getPriorityBadge(priority) {
    const badges = {
        'normale': '<span class="badge bg-outline-secondary priority-badge"><i class="bi bi-dash-circle me-1"></i>Normale</span>',
        'urgente': '<span class="badge bg-danger priority-badge"><i class="bi bi-exclamation-triangle-fill me-1"></i>Urgente</span>'
    };
    return badges[priority] || `<span class="badge bg-secondary">${priority}</span>`;
}

/**
 * Afficher une notification toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type: success, danger, warning, info
 */
function showToast(message, type = 'info') {
    // Supprimer les toasts existants
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    const icons = {
        success: '<i class="bi bi-check-circle-fill"></i>',
        danger: '<i class="bi bi-x-circle-fill"></i>',
        warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
        info: '<i class="bi bi-info-circle-fill"></i>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Suppression automatique après 4 secondes
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Mettre à jour la navigation selon le rôle
 */
function updateNavigation() {
    const user = getUser();
    if (!user) return;

    // Afficher le nom de l'utilisateur
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }

    // Afficher le rôle
    const userRoleEl = document.getElementById('user-role');
    if (userRoleEl) {
        userRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    // Masquer/afficher les éléments selon le rôle
    document.querySelectorAll('[data-role]').forEach(el => {
        const roles = el.dataset.role.split(',');
        el.style.display = roles.includes(user.role) ? '' : 'none';
    });
}
