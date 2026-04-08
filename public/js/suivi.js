/**
 * public/js/suivi.js - Page de suivi des réclamations
 * Affiche la liste des réclamations avec les réponses
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier l'authentification
    if (!requireAuth()) return;

    updateNavigation();

    // Charger les réclamations
    await loadSuiviReclamations();
});

/**
 * Charger les réclamations pour la page de suivi
 */
async function loadSuiviReclamations() {
    try {
        const data = await apiRequest('/reclamations');
        if (!data) return;

        const container = document.getElementById('suivi-list');
        if (!container) return;

        const user = getUser();

        if (data.reclamations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-chat-square-text"></i>
                    <h5>Aucune réclamation à suivre</h5>
                    <p class="text-muted">
                        ${user.role === 'client' 
                            ? '<a href="/reclamation" class="text-primary-custom">Soumettez votre première réclamation</a>' 
                            : 'Aucune réclamation disponible.'}
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.reclamations.map(rec => `
            <div class="suivi-card" id="rec-${rec.id}">
                <div class="suivi-card-header" onclick="toggleReclamation(${rec.id})">
                    <div class="suivi-info">
                        <div class="suivi-title-row">
                            <h5>${escapeHtml(rec.title)}</h5>
                            <span class="suivi-id">#${rec.id}</span>
                        </div>
                        <div class="suivi-badges">
                            ${getStatusBadge(rec.status)}
                            ${getPriorityBadge(rec.priority)}
                        </div>
                        <p class="suivi-desc">${escapeHtml(rec.description)}</p>
                        <div class="suivi-meta">
                            <span><i class="bi bi-person me-1"></i>${escapeHtml(rec.user_name)}</span>
                            <span><i class="bi bi-calendar me-1"></i>${formatDate(rec.created_at)}</span>
                        </div>
                    </div>
                    <div class="suivi-toggle">
                        <i class="bi bi-chevron-down"></i>
                    </div>
                </div>
                <div class="suivi-content" id="content-${rec.id}">
                    <div class="responses-container" id="responses-${rec.id}">
                        <div class="text-center py-3">
                            <span class="spinner-border spinner-border-sm"></span>
                            <span class="ms-2">Chargement des réponses...</span>
                        </div>
                    </div>
                    <div class="response-form-container">
                        <form onsubmit="submitResponse(event, ${rec.id})" class="response-form">
                            <div class="input-group">
                                <input type="text" class="form-control" 
                                    id="response-input-${rec.id}" 
                                    placeholder="Écrire une réponse..."
                                    required>
                                <button type="submit" class="btn btn-primary-custom">
                                    <i class="bi bi-send-fill"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement suivi:', error);
        showToast('Erreur lors du chargement', 'danger');
    }
}

/**
 * Basculer l'affichage du contenu d'une réclamation (accordion)
 * @param {number} recId - ID de la réclamation
 */
async function toggleReclamation(recId) {
    const content = document.getElementById(`content-${recId}`);
    const card = document.getElementById(`rec-${recId}`);

    if (content.classList.contains('open')) {
        content.classList.remove('open');
        card.classList.remove('expanded');
    } else {
        // Fermer les autres
        document.querySelectorAll('.suivi-content.open').forEach(el => {
            el.classList.remove('open');
            el.closest('.suivi-card').classList.remove('expanded');
        });

        content.classList.add('open');
        card.classList.add('expanded');

        // Charger les réponses
        await loadResponses(recId);
    }
}

/**
 * Charger les réponses d'une réclamation
 * @param {number} recId - ID de la réclamation
 */
async function loadResponses(recId) {
    const container = document.getElementById(`responses-${recId}`);
    if (!container) return;

    try {
        const data = await apiRequest(`/responses/${recId}`);
        if (!data) return;

        if (data.responses.length === 0) {
            container.innerHTML = `
                <div class="no-responses">
                    <i class="bi bi-chat-left-text"></i>
                    <p>Aucune réponse pour le moment</p>
                </div>
            `;
            return;
        }

        const user = getUser();

        container.innerHTML = data.responses.map(resp => `
            <div class="response-item ${resp.user_id === user.id ? 'own-response' : ''}">
                <div class="response-header">
                    <span class="response-author">
                        <i class="bi bi-person-circle me-1"></i>
                        ${escapeHtml(resp.user_name)}
                        <span class="response-role badge bg-${resp.user_role === 'admin' ? 'danger' : resp.user_role === 'agent' ? 'info' : 'secondary'} ms-1">
                            ${resp.user_role}
                        </span>
                    </span>
                    <span class="response-date">
                        <i class="bi bi-clock me-1"></i>${formatDate(resp.created_at)}
                    </span>
                </div>
                <div class="response-body">
                    ${escapeHtml(resp.message)}
                </div>
            </div>
        `).join('');

        // Scroll vers le bas des réponses
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        container.innerHTML = `<p class="text-danger text-center">Erreur de chargement</p>`;
    }
}

/**
 * Soumettre une réponse à une réclamation
 * @param {Event} e - Événement du formulaire
 * @param {number} recId - ID de la réclamation
 */
async function submitResponse(e, recId) {
    e.preventDefault();

    const input = document.getElementById(`response-input-${recId}`);
    const message = input.value.trim();

    if (!message) return;

    try {
        await apiRequest('/responses', {
            method: 'POST',
            body: JSON.stringify({
                message,
                reclamation_id: recId
            })
        });

        // Vider le champ et recharger les réponses
        input.value = '';
        await loadResponses(recId);
        showToast('Réponse envoyée', 'success');
    } catch (error) {
        showToast(error.message || 'Erreur d\'envoi', 'danger');
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
