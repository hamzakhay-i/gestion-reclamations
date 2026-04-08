/**
 * public/js/auth.js - Gestion de l'authentification côté client
 * Login et inscription avec appels API
 */

document.addEventListener('DOMContentLoaded', () => {
    // Si déjà connecté, rediriger vers le dashboard
    if (getToken()) {
        window.location.href = '/dashboard';
        return;
    }

    // Éléments du DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');

    // ========================
    // Basculer entre login et inscription
    // ========================

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.classList.add('hidden');
            registerCard.classList.remove('hidden');
            registerCard.classList.add('fade-in');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
            loginCard.classList.add('fade-in');
        });
    }

    // ========================
    // Formulaire de connexion
    // ========================

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Désactiver le bouton pendant le chargement
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                // Sauvegarder les données d'auth et rediriger
                saveAuth(data.token, data.user);
                showToast('Connexion réussie ! Redirection...', 'success');

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 800);

            } catch (error) {
                showToast(error.message || 'Erreur de connexion', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Se connecter';
            }
        });
    }

    // ========================
    // Formulaire d'inscription
    // ========================

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const role = document.getElementById('register-role').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            // Vérifier les mots de passe
            if (password !== confirmPassword) {
                showToast('Les mots de passe ne correspondent pas.', 'warning');
                return;
            }

            if (password.length < 6) {
                showToast('Le mot de passe doit contenir au moins 6 caractères.', 'warning');
                return;
            }

            // Désactiver le bouton
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Inscription...';

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                // Sauvegarder et rediriger
                saveAuth(data.token, data.user);
                showToast('Inscription réussie ! Bienvenue !', 'success');

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 800);

            } catch (error) {
                showToast(error.message || 'Erreur lors de l\'inscription', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>S\'inscrire';
            }
        });
    }
});
