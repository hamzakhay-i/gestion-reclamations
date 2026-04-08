/**
 * public/js/suivi.js - Page de suivi des réclamations
 * Affiche les réclamations avec un système de chat/discussion en bulles
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
                    <div class="chat-container" id="chat-${rec.id}">
                        <div class="text-center py-3">
                            <span class="spinner-border spinner-border-sm"></span>
                            <span class="ms-2">Chargement de la discussion...</span>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <form onsubmit="submitResponse(event, ${rec.id})" class="chat-form">
                            <div class="chat-input-wrapper">
                                <textarea class="chat-input" 
                                    id="response-input-${rec.id}" 
                                    placeholder="Écrire un message..."
                                    rows="1"
                                    required
                                    onkeydown="handleChatKeydown(event, ${rec.id})"
                                    oninput="autoResize(this)"></textarea>
                                <button type="submit" class="chat-send-btn" title="Envoyer">
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
 * Charger les réponses d'une réclamation — format chat/bulles
 */
async function loadResponses(recId) {
    const container = document.getElementById(`chat-${recId}`);
    if (!container) return;

    try {
        const data = await apiRequest(`/responses/${recId}`);
        if (!data) return;

        if (data.responses.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <i class="bi bi-chat-dots"></i>
                    <p>Aucun message pour le moment</p>
                    <span>Commencez la discussion !</span>
                </div>
            `;
            return;
        }

        const user = getUser();
        let lastDate = '';

        container.innerHTML = data.responses.map(resp => {
            const isOwn = resp.user_id === user.id;
            const messageDate = new Date(resp.created_at).toLocaleDateString('fr-FR');
            let dateSeparator = '';

            // Ajouter un séparateur de date si le jour change
            if (messageDate !== lastDate) {
                lastDate = messageDate;
                dateSeparator = `
                    <div class="chat-date-separator">
                        <span>${messageDate === new Date().toLocaleDateString('fr-FR') ? "Aujourd'hui" : messageDate}</span>
                    </div>
                `;
            }

            // Couleur de l'avatar selon le rôle
            const avatarClass = resp.user_role === 'admin' ? 'avatar-admin' 
                : resp.user_role === 'agent' ? 'avatar-agent' 
                : 'avatar-client';

            return `
                ${dateSeparator}
                <div class="chat-message ${isOwn ? 'chat-own' : 'chat-other'}">
                    ${!isOwn ? `
                        <div class="chat-avatar ${avatarClass}" title="${escapeHtml(resp.user_name)}">
                            ${resp.user_name.charAt(0).toUpperCase()}
                        </div>
                    ` : ''}
                    <div class="chat-bubble ${isOwn ? 'bubble-own' : 'bubble-other'}">
                        ${!isOwn ? `
                            <div class="chat-sender">
                                <span class="sender-name">${escapeHtml(resp.user_name)}</span>
                                <span class="sender-role role-${resp.user_role}">${resp.user_role}</span>
                            </div>
                        ` : ''}
                        <div class="chat-text">${escapeHtml(resp.message)}</div>
                        <div class="chat-time">
                            ${new Date(resp.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            ${isOwn ? '<i class="bi bi-check2-all ms-1"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll vers le bas des messages
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    } catch (error) {
        container.innerHTML = `<p class="text-danger text-center">Erreur de chargement</p>`;
    }
}

/**
 * Soumettre une réponse à une réclamation
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

        // Vider le champ, remettre à 1 ligne, et recharger les réponses
        input.value = '';
        input.style.height = 'auto';
        await loadResponses(recId);
    } catch (error) {
        showToast(error.message || 'Erreur d\'envoi', 'danger');
    }
}

/**
 * Gérer Entrée pour envoyer (Shift+Entrée pour nouvelle ligne)
 */
function handleChatKeydown(e, recId) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const form = e.target.closest('form');
        if (form) form.requestSubmit();
    }
}

/**
 * Auto-resize du textarea en fonction du contenu
 */
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

/**
 * Échapper les caractères HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
