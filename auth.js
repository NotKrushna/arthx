/* ============================================================
   AUTH MODULE — arthX
   Sign up, login, logout, and auth-state UI management.
   Depends on: supabaseClient.js (must be loaded first)
============================================================ */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const authModal       = document.getElementById('authModal');
  const authOverlay     = document.getElementById('authOverlay');
  const authCloseBtn    = document.getElementById('authCloseBtn');
  const authTabs        = document.querySelectorAll('.auth-tab');
  const loginForm       = document.getElementById('loginForm');
  const signupForm      = document.getElementById('signupForm');
  const loginPanel      = document.getElementById('loginPanel');
  const signupPanel     = document.getElementById('signupPanel');

  // Nav auth controls
  const navLoginBtn     = document.getElementById('navLoginBtn');
  const navUserInfo     = document.getElementById('navUserInfo');
  const navUserEmail    = document.getElementById('navUserEmail');
  const navLogoutBtn    = document.getElementById('navLogoutBtn');
  const navDashboardBtn = document.getElementById('navDashboardBtn');

  /* ---------- Modal open / close ---------- */
  function openAuthModal(tab = 'login') {
    if (!authModal) return;
    authModal.classList.add('is-open');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    switchAuthTab(tab);
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('is-open');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function switchAuthTab(tab) {
    authTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    if (loginPanel) loginPanel.classList.toggle('active', tab === 'login');
    if (signupPanel) signupPanel.classList.toggle('active', tab === 'signup');
  }

  if (navLoginBtn) navLoginBtn.addEventListener('click', () => openAuthModal('login'));
  if (navDashboardBtn) navDashboardBtn.addEventListener('click', () => window.location.href = 'app.html');
  if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
  if (authOverlay) authOverlay.addEventListener('click', closeAuthModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('is-open')) {
      closeAuthModal();
    }
  });

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  /* ---------- Sign Up ---------- */
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button[type="submit"]');
      const email = signupForm.querySelector('[name="signup-email"]').value.trim();
      const password = signupForm.querySelector('[name="signup-password"]').value;
      const fullName = signupForm.querySelector('[name="signup-name"]')?.value.trim() || '';

      if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      setLoading(btn, true);

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      setLoading(btn, false);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      if (data.user && !data.user.confirmed_at && data.user.identities?.length === 0) {
        showToast('This email is already registered. Try logging in.', 'error');
      } else {
        showToast('Account created! Check your email to confirm, or log in directly.', 'success');
        switchAuthTab('login');
      }
    });
  }

  /* ---------- Login ---------- */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const email = loginForm.querySelector('[name="login-email"]').value.trim();
      const password = loginForm.querySelector('[name="login-password"]').value;

      if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      setLoading(btn, true);

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      setLoading(btn, false);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      showToast(`Welcome back, ${data.user.email}!`, 'success');
      closeAuthModal();
      
      // Redirect to full-screen dashboard
      setTimeout(() => {
        window.location.href = 'app.html';
      }, 500);
    });
  }

  /* ---------- Logout ---------- */
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Logged out successfully.', 'info');
      }
    });
  }

  /* ---------- Auth state listener ---------- */
  function updateAuthUI(session) {
    const user = session?.user;

    if (user) {
      // Logged in
      if (navLoginBtn) navLoginBtn.style.display = 'none';
      if (navUserInfo) navUserInfo.style.display = 'flex';
      if (navUserEmail) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        navUserEmail.textContent = name;
      }
      if (navDashboardBtn) navDashboardBtn.style.display = '';

      // Dispatch custom event so dashboard.js can react
      document.dispatchEvent(new CustomEvent('arthx:auth', { detail: { user } }));
    } else {
      // Logged out
      if (navLoginBtn) navLoginBtn.style.display = '';
      if (navUserInfo) navUserInfo.style.display = 'none';
      if (navDashboardBtn) navDashboardBtn.style.display = 'none';

      document.dispatchEvent(new CustomEvent('arthx:auth', { detail: { user: null } }));
    }
  }

  // Listen for auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
  });

  // Check initial session
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    updateAuthUI(session);
  });

  // Expose for other modules
  window.arthxAuth = {
    openAuthModal,
    closeAuthModal,
  };
})();
