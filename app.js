/* app.js - App Shell Navigation Logic */

(function () {
  'use strict';

  let currentUser = null;

  document.addEventListener('arthx:auth', (e) => {
    currentUser = e.detail.user;
    
    // Protect the app.html route
    if (!currentUser && window.location.pathname.includes('app.html')) {
      window.location.href = 'index.html';
      return;
    }

    // Populate user info in sidebar
    const userEmailEl = document.getElementById('navUserEmail');
    if (userEmailEl && currentUser) {
      userEmailEl.textContent = currentUser.email;
    }
  });

  // Sidebar Tab Switching
  const navLinks = document.querySelectorAll('.app-nav-link');
  const dashContents = document.querySelectorAll('.app-main .dash-content');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      link.classList.add('active');

      const targetId = link.getAttribute('data-dash');
      
      // Hide all contents
      dashContents.forEach(content => {
        content.classList.remove('active');
      });

      // Show target content
      const targetContent = document.getElementById(`dash-${targetId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Function to switch to a specific tab programmatically
  function switchToTab(targetId) {
    const link = document.querySelector(`.app-nav-link[data-dash="${targetId}"]`);
    if (link) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
    dashContents.forEach(content => content.classList.remove('active'));
    const targetContent = document.getElementById(`dash-${targetId}`);
    if (targetContent) targetContent.classList.add('active');
  }

  // Check URL for AI param
  if (window.location.search.includes('ai=true')) {
    switchToTab('ai');
    // Clean up URL without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Intercept FAB click on app.html to prevent reload
  const finyFab = document.getElementById('finyFab');
  if (finyFab && window.location.pathname.includes('app.html')) {
    finyFab.removeAttribute('onclick');
    finyFab.addEventListener('click', (e) => {
      e.preventDefault();
      switchToTab('ai');
    });
  }

  // Logout Logic
  const logoutBtn = document.getElementById('appLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
      }
    });
  }

})();
