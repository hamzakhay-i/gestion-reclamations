/**
 * public/js/dashboard.js - Logique du tableau de bord
 * Affiche les statistiques, réclamations, et gestion des utilisateurs (admin)
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

    // Charger les utilisateurs et agents en attente pour l'admin
    if (user.role === 'admin') {
        await loadPendingAgents();
        await loadAllUsers();
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
 * Charger les agents en attente d'approbation (admin)
 */
async function loadPendingAgents() {
    try {
        const data = await apiRequest('/auth/pending-agents');
        if (!data) return;

        const container = document.getElementById('pending-agents-list');
        const countBadge = document.getElementById('pending-count');
        if (!container) return;

        if (countBadge) {
            countBadge.textContent = data.agents.length;
        }

        if (data.agents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3 text-muted" style="font-size: 0.85rem;">
                    <i class="bi bi-check-circle me-1"></i>Aucun agent en attente
                </div>
            `;
            return;
        }

        container.innerHTML = data.agents.map(agent => `
            <div class="agent-pending-card">
                <div class="agent-info">
                    <div class="agent-avatar">
                        ${agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="agent-name">${escapeHtml(agent.name)}</div>
                        <div class="agent-email">${escapeHtml(agent.email)}</div>
                        <div class="agent-date"><i class="bi bi-clock me-1"></i>${formatDate(agent.created_at)}</div>
                    </div>
                </div>
                <div class="agent-actions">
                    <button class="btn btn-sm btn-success-custom" onclick="approveAgent(${agent.id})" title="Approuver">
                        <i class="bi bi-check-lg me-1"></i>Approuver
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="rejectAgent(${agent.id})" title="Refuser">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement agents en attente:', error);
    }
}

/**
 * Charger la liste de tous les utilisateurs (admin)
 */
async function loadAllUsers() {
    try {
        const data = await apiRequest('/auth/users');
        if (!data) return;

        const container = document.getElementById('users-list');
        if (!container) return;

        const currentUser = getUser();

        container.innerHTML = `
            <div class="table-responsive">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Inscrit le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.users.map(u => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="user-avatar-sm ${u.role}">${u.name.charAt(0).toUpperCase()}</div>
                                        <span>${escapeHtml(u.name)}</span>
                                    </div>
                                </td>
                                <td class="text-muted-cell">${escapeHtml(u.email)}</td>
                                <td>
                                    <span class="badge role-badge-${u.role}">
                                        ${u.role === 'admin' ? '<i class="bi bi-shield-fill me-1"></i>' : ''}
                                        ${u.role === 'agent' ? '<i class="bi bi-headset me-1"></i>' : ''}
                                        ${u.role === 'client' ? '<i class="bi bi-person me-1"></i>' : ''}
                                        ${u.role}
                                    </span>
                                </td>
                                <td>
                                    ${u.is_active 
                                        ? '<span class="status-active"><i class="bi bi-circle-fill me-1"></i>Actif</span>'
                                        : '<span class="status-inactive"><i class="bi bi-circle-fill me-1"></i>Inactif</span>'
                                    }
                                </td>
                                <td class="text-muted-cell">${formatDate(u.created_at)}</td>
                                <td>
                                    ${u.id !== currentUser.id ? `
                                        <div class="d-flex gap-1">
                                            ${!u.is_active ? `
                                                <button class="btn btn-xs btn-success-custom" onclick="activateUser(${u.id})" title="Activer">
                                                    <i class="bi bi-check-lg"></i>
                                                </button>
                                            ` : `
                                                <button class="btn btn-xs btn-outline-warning-custom" onclick="deactivateUser(${u.id})" title="Désactiver">
                                                    <i class="bi bi-pause-fill"></i>
                                                </button>
                                            `}
                                            <button class="btn btn-xs btn-outline-danger" onclick="deleteUserAdmin(${u.id}, '${escapeHtml(u.name)}')" title="Supprimer">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    ` : '<span class="text-muted" style="font-size:0.75rem;">Vous</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

/**
 * Approuver un agent en attente
 */
async function approveAgent(id) {
    try {
        await apiRequest(`/auth/activate/${id}`, { method: 'PUT' });
        showToast('Agent approuvé avec succès', 'success');
        await loadPendingAgents();
        await loadAllUsers();
    } catch (error) {
        showToast(error.message || 'Erreur d\'approbation', 'danger');
    }
}

/**
 * Refuser (supprimer) un agent en attente
 */
async function rejectAgent(id) {
    if (!confirm('Êtes-vous sûr de vouloir refuser cet agent ? Son compte sera supprimé.')) return;
    try {
        await apiRequest(`/auth/users/${id}`, { method: 'DELETE' });
        showToast('Agent refusé et supprimé', 'success');
        await loadPendingAgents();
        await loadAllUsers();
    } catch (error) {
        showToast(error.message || 'Erreur de refus', 'danger');
    }
}

/**
 * Activer un utilisateur
 */
async function activateUser(id) {
    try {
        await apiRequest(`/auth/activate/${id}`, { method: 'PUT' });
        showToast('Utilisateur activé', 'success');
        await loadAllUsers();
        await loadPendingAgents();
    } catch (error) {
        showToast(error.message || 'Erreur', 'danger');
    }
}

/**
 * Désactiver un utilisateur
 */
async function deactivateUser(id) {
    if (!confirm('Désactiver cet utilisateur ? Il ne pourra plus se connecter.')) return;
    try {
        await apiRequest(`/auth/deactivate/${id}`, { method: 'PUT' });
        showToast('Utilisateur désactivé', 'success');
        await loadAllUsers();
    } catch (error) {
        showToast(error.message || 'Erreur', 'danger');
    }
}

/**
 * Supprimer un utilisateur (admin)
 */
async function deleteUserAdmin(id, name) {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irréversible.`)) return;
    try {
        await apiRequest(`/auth/users/${id}`, { method: 'DELETE' });
        showToast('Utilisateur supprimé', 'success');
        await loadAllUsers();
        await loadPendingAgents();
        await loadStats();
    } catch (error) {
        showToast(error.message || 'Erreur de suppression', 'danger');
    }
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
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
