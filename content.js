/* ============================================================
   CONTENT MODULE — arthX
   Fetches published content (articles, learning modules) from
   the Supabase 'content' table. Falls back gracefully to
   the existing static HTML if the table is empty or unavailable.
   Depends on: supabaseClient.js (must be loaded first)
============================================================ */

(function () {
  'use strict';

  /* ---------- Waitlist form ---------- */
  const waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = waitlistForm.querySelector('button[type="submit"]');
      const email = waitlistForm.querySelector('[name="waitlist-email"]').value.trim();
      const name = waitlistForm.querySelector('[name="waitlist-name"]')?.value.trim() || '';

      if (!email) {
        showToast('Please enter your email.', 'error');
        return;
      }

      setLoading(btn, true);

      const { error } = await supabaseClient
        .from('waitlist')
        .insert({ email, name });

      setLoading(btn, false);

      if (error) {
        if (error.code === '23505') {
          showToast("You're already on the waitlist!", 'info');
        } else {
          showToast(error.message, 'error');
        }
        return;
      }

      showToast('Welcome to the waitlist! 🎉', 'success');
      waitlistForm.reset();
    });
  }

  /* ---------- Dynamic content (Learn section) ---------- */
  async function loadDynamicContent() {
    const contentContainer = document.getElementById('dynamicContentList');
    if (!contentContainer) return;

    const { data, error } = await supabaseClient
      .from('content')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error || !data || data.length === 0) {
      // No dynamic content — keep the existing static HTML visible
      return;
    }

    contentContainer.innerHTML = data.map(item => `
      <article class="dynamic-card" data-reveal>
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="dynamic-card-img">` : ''}
        <div class="dynamic-card-body">
          <span class="mono dynamic-card-cat">${item.category || 'ARTICLE'}</span>
          <h3>${item.title}</h3>
          <p>${item.body ? item.body.substring(0, 140) + '…' : ''}</p>
        </div>
      </article>
    `).join('');

    // Re-observe new elements for scroll reveal
    if ('IntersectionObserver' in window) {
      const revealIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

      contentContainer.querySelectorAll('[data-reveal]').forEach(el => revealIO.observe(el));
    }
  }

  // Load dynamic content on page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicContent);
  } else {
    loadDynamicContent();
  }
})();
