/**
 * public/js/reclamation.js - Page de création de réclamation
 * Formulaire pour soumettre une nouvelle réclamation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    if (!requireAuth()) return;

    updateNavigation();

    const form = document.getElementById('reclamation-form');
    if (!form) return;

    // ========================
    // Soumission du formulaire
    // ========================

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('rec-title').value.trim();
        const description = document.getElementById('rec-description').value.trim();
        const priority = document.getElementById('rec-priority').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Validation
        if (!title || !description) {
            showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
            return;
        }

        if (title.length < 5) {
            showToast('Le titre doit contenir au moins 5 caractères.', 'warning');
            return;
        }

        if (description.length < 10) {
            showToast('La description doit contenir au moins 10 caractères.', 'warning');
            return;
        }

        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi en cours...';

        try {
            await apiRequest('/reclamations', {
                method: 'POST',
                body: JSON.stringify({ title, description, priority })
            });

            showToast('Réclamation soumise avec succès !', 'success');

            // Réinitialiser le formulaire
            form.reset();

            // Rediriger vers le suivi après 1.5s
            setTimeout(() => {
                window.location.href = '/suivi';
            }, 1500);

        } catch (error) {
            showToast(error.message || 'Erreur lors de la soumission', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send-fill me-2"></i>Soumettre la réclamation';
        }
    });

    // ========================
    // Compteur de caractères pour la description
    // ========================

    const descriptionField = document.getElementById('rec-description');
    const charCounter = document.getElementById('char-counter');

    if (descriptionField && charCounter) {
        descriptionField.addEventListener('input', () => {
            const count = descriptionField.value.length;
            charCounter.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
        });
    }
});
