/**
 * public/js/dashboard.js - Logique du tableau de bord
 * Affiche les statistiques et la liste des réclamations selon le rôle
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier l'authentification
    if (!requireAuth()) return;

    const user = getUser();
    updateNavigation();

    // Charger les données selon le rôle
    await loadReclamations();

    // Charger les stats pour admin/agent
    if (user.role === 'admin' || user.role === 'agent') {
        await loadStats();
    }
});

/**
 * Charger et afficher les statistiques du dashboard
 */
async function loadStats() {
    try {
        const data = await apiRequest('/reclamations/stats');
        if (!data) return;

        const stats = data.stats;

        // Mettre à jour les compteurs
        animateCounter('stats-total', stats.total || 0);
        animateCounter('stats-ouvertes', stats.ouvertes || 0);
        animateCounter('stats-en-cours', stats.en_cours || 0);
        animateCounter('stats-traitees', stats.traitees || 0);
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

/**
 * Animation de compteur pour les statistiques
 * @param {string} elementId - ID de l'élément
 * @param {number} target - Valeur cible
 */
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Charger et afficher la liste des réclamations
 */
async function loadReclamations() {
    try {
        const data = await apiRequest('/reclamations');
        if (!data) return;

        const container = document.getElementById('reclamations-list');
        if (!container) return;

        const user = getUser();

        if (data.reclamations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>Aucune réclamation</h5>
                    <p class="text-muted">
                        ${user.role === 'client' 
                            ? 'Vous n\'avez pas encore soumis de réclamation.' 
                            : 'Aucune réclamation à traiter pour le moment.'}
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.reclamations.map(rec => `
            <div class="reclamation-card" data-id="${rec.id}">
                <div class="reclamation-header">
                    <div class="reclamation-title-row">
                        <h5 class="reclamation-title">${escapeHtml(rec.title)}</h5>
                        <div class="reclamation-badges">
                            ${getStatusBadge(rec.status)}
                            ${getPriorityBadge(rec.priority)}
                        </div>
                    </div>
                    <p class="reclamation-desc">${escapeHtml(rec.description)}</p>
                </div>
                <div class="reclamation-footer">
                    <div class="reclamation-meta">
                        <span><i class="bi bi-person me-1"></i>${escapeHtml(rec.user_name)}</span>
                        <span><i class="bi bi-calendar me-1"></i>${formatDate(rec.created_at)}</span>
                    </div>
                    <div class="reclamation-actions">
                        ${(user.role === 'agent' || user.role === 'admin') ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="bi bi-gear me-1"></i>Statut
                                </button>
                                <ul class="dropdown-menu dropdown-menu-dark">
                                    <li><a class="dropdown-item" href="#" onclick="updateStatus(${rec.id}, 'ouverte')">
                                        <i class="bi bi-circle-fill text-warning me-2"></i>Ouverte</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="updateStatus(${rec.id}, 'en_cours')">
                                        <i class="bi bi-arrow-repeat text-info me-2"></i>En cours</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="updateStatus(${rec.id}, 'traitée')">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>Traitée</a></li>
                                </ul>
                            </div>
                        ` : ''}
                        <a href="/suivi" class="btn btn-sm btn-primary-custom">
                            <i class="bi bi-chat-dots me-1"></i>Détails
                        </a>
                        ${user.role === 'admin' ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteReclamation(${rec.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement réclamations:', error);
        showToast('Erreur lors du chargement des réclamations', 'danger');
    }
}

/**
 * Mettre à jour le statut d'une réclamation
 * @param {number} id - ID de la réclamation
 * @param {string} status - Nouveau statut
 */
async function updateStatus(id, status) {
    try {
        await apiRequest(`/reclamations/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        showToast('Statut mis à jour avec succès', 'success');
        await loadReclamations();
        
        const user = getUser();
        if (user.role === 'admin' || user.role === 'agent') {
            await loadStats();
        }
    } catch (error) {
        showToast(error.message || 'Erreur de mise à jour', 'danger');
    }
}

/**
 * Supprimer une réclamation (admin uniquement)
 * @param {number} id - ID de la réclamation
 */
async function deleteReclamation(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) return;

    try {
        await apiRequest(`/reclamations/${id}`, {
            method: 'DELETE'
        });

        showToast('Réclamation supprimée', 'success');
        await loadReclamations();
        await loadStats();
    } catch (error) {
        showToast(error.message || 'Erreur de suppression', 'danger');
    }
}

/**
 * Échapper les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
