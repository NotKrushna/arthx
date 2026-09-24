/* ============================================================
   DASHBOARD MODULE — arthX
   Expenses, Net Worth, Portfolio CRUD.
   Depends on: supabaseClient.js, auth.js (must be loaded first)
============================================================ */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const dashPanel        = document.getElementById('dashboardPanel');
  const dashOverlay      = document.getElementById('dashboardOverlay');
  const dashCloseBtn     = document.getElementById('dashCloseBtn');
  const navDashboardBtn  = document.getElementById('navDashboardBtn');
  const dashTabs         = document.querySelectorAll('.dash-tab');
  const dashPanels       = document.querySelectorAll('.dash-content');

  // Expense elements
  const expenseForm      = document.getElementById('expenseForm');
  const expenseList      = document.getElementById('expenseList');
  const expenseTotal     = document.getElementById('expenseTotal');

  // Net worth elements
  const nwForm           = document.getElementById('nwForm');
  const nwDisplay        = document.getElementById('nwDisplay');

  // Portfolio elements
  const portfolioForm    = document.getElementById('portfolioForm');
  const portfolioDisplay = document.getElementById('portfolioDisplay');

  let currentUser = null;

  /* ---------- Dashboard open / close ---------- */
  function openDashboard() {
    if (!dashPanel) return;
    dashPanel.classList.add('is-open');
    if (dashOverlay) dashOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (currentUser) loadAllData();
  }

  function closeDashboard() {
    if (!dashPanel) return;
    dashPanel.classList.remove('is-open');
    if (dashOverlay) dashOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (navDashboardBtn) {
    navDashboardBtn.addEventListener('click', () => {
      window.location.href = 'app.html';
    });
  }

  // Fallback for close overlay if still present
  if (dashCloseBtn) dashCloseBtn.addEventListener('click', closeDashboard);
  if (dashOverlay) dashOverlay.addEventListener('click', closeDashboard);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dashPanel?.classList.contains('is-open')) {
      closeDashboard();
    }
  });

  /* ---------- Auth event ---------- */
  document.addEventListener('arthx:auth', (e) => {
    currentUser = e.detail.user;
    if (currentUser) {
      loadAllData();
    }
  });

  /* ---------- Load all data ---------- */
  async function loadAllData() {
    await Promise.all([
      loadExpenses(),
      loadNetWorth(),
      loadPortfolio(),
    ]);
  }

  /* ==========================================================
     EXPENSES
  ========================================================== */
  async function loadExpenses() {
    if (!expenseList || !currentUser) return;
    expenseList.innerHTML = '<p class="dash-loading mono">Loading…</p>';

    const { data, error } = await supabaseClient
      .from('expenses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      expenseList.innerHTML = '<p class="dash-empty mono">Could not load expenses.</p>';
      console.error(error);
      return;
    }

    if (!data.length) {
      expenseList.innerHTML = '<p class="dash-empty mono">No expenses yet. Add one below!</p>';
      if (expenseTotal) expenseTotal.textContent = formatINR(0);
      return;
    }

    const total = data.reduce((s, e) => s + parseFloat(e.amount), 0);
    if (expenseTotal) expenseTotal.textContent = formatINR(total);

    expenseList.innerHTML = data.map(exp => `
      <div class="expense-row">
        <div class="expense-info">
          <span class="expense-category mono">${exp.category}</span>
          <span class="expense-desc">${exp.description || '—'}</span>
          <span class="expense-date mono">${formatDate(exp.date)}</span>
        </div>
        <span class="expense-amount mono">${formatINR(exp.amount)}</span>
        <button class="expense-delete" data-id="${exp.id}" aria-label="Delete expense">✕</button>
      </div>
    `).join('');

    // Delete buttons
    expenseList.querySelectorAll('.expense-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabaseClient.from('expenses').delete().eq('id', btn.dataset.id);
        if (error) { showToast('Failed to delete.', 'error'); return; }
        showToast('Expense deleted.', 'info');
        loadExpenses();
      });
    });
  }

  if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) { showToast('Please log in first.', 'error'); return; }

      const btn = expenseForm.querySelector('button[type="submit"]');
      const amount = parseFloat(expenseForm.querySelector('[name="exp-amount"]').value);
      const category = expenseForm.querySelector('[name="exp-category"]').value;
      const description = expenseForm.querySelector('[name="exp-desc"]').value.trim();
      const date = expenseForm.querySelector('[name="exp-date"]').value || new Date().toISOString().slice(0, 10);

      if (!amount || !category) {
        showToast('Amount and category are required.', 'error');
        return;
      }

      setLoading(btn, true);
      const { error } = await supabaseClient.from('expenses').insert({
        user_id: currentUser.id,
        amount,
        category,
        description,
        date
      });
      setLoading(btn, false);

      if (error) { showToast(error.message, 'error'); return; }
      showToast('Expense added!', 'success');
      expenseForm.reset();
      loadExpenses();
    });
  }

  /* ==========================================================
     NET WORTH
  ========================================================== */
  async function loadNetWorth() {
    if (!nwDisplay || !currentUser) return;
    nwDisplay.innerHTML = '<p class="dash-loading mono">Loading…</p>';

    const { data, error } = await supabaseClient
      .from('net_worth')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      nwDisplay.innerHTML = '<p class="dash-empty mono">Could not load net worth.</p>';
      return;
    }

    if (!data) {
      nwDisplay.innerHTML = `
        <div class="nw-summary">
          <div class="nw-card"><span class="mono">ASSETS</span><strong>${formatINR(0)}</strong></div>
          <div class="nw-card"><span class="mono">LIABILITIES</span><strong>${formatINR(0)}</strong></div>
          <div class="nw-card nw-total"><span class="mono">NET WORTH</span><strong>${formatINR(0)}</strong></div>
        </div>
        <p class="dash-empty mono">Add your assets and liabilities below to calculate net worth.</p>
      `;
      return;
    }

    nwDisplay.innerHTML = `
      <div class="nw-summary">
        <div class="nw-card"><span class="mono">ASSETS</span><strong>${formatINR(data.total_assets)}</strong></div>
        <div class="nw-card"><span class="mono">LIABILITIES</span><strong>${formatINR(data.total_liabilities)}</strong></div>
        <div class="nw-card nw-total"><span class="mono">NET WORTH</span><strong>${formatINR(data.net_worth)}</strong></div>
      </div>
    `;
  }

  if (nwForm) {
    nwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) { showToast('Please log in first.', 'error'); return; }

      const btn = nwForm.querySelector('button[type="submit"]');
      const totalAssets = parseFloat(nwForm.querySelector('[name="nw-assets"]').value) || 0;
      const totalLiabilities = parseFloat(nwForm.querySelector('[name="nw-liabilities"]').value) || 0;
      const netWorth = totalAssets - totalLiabilities;

      setLoading(btn, true);

      // Upsert — one row per user
      const { data: existing } = await supabaseClient
        .from('net_worth')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabaseClient.from('net_worth').update({
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id));
      } else {
        ({ error } = await supabaseClient.from('net_worth').insert({
          user_id: currentUser.id,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth
        }));
      }

      setLoading(btn, false);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Net worth updated!', 'success');
      loadNetWorth();
    });
  }

  /* ==========================================================
     PORTFOLIO
  ========================================================== */
  async function loadPortfolio() {
    if (!portfolioDisplay || !currentUser) return;
    portfolioDisplay.innerHTML = '<p class="dash-loading mono">Loading…</p>';

    const { data, error } = await supabaseClient
      .from('portfolios')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      portfolioDisplay.innerHTML = '<p class="dash-empty mono">Could not load portfolio.</p>';
      return;
    }

    if (!data) {
      portfolioDisplay.innerHTML = '<p class="dash-empty mono">No portfolio yet. Create one below!</p>';
      return;
    }

    const alloc = data.allocation || {};
    const total = parseFloat(data.total_value) || 0;

    portfolioDisplay.innerHTML = `
      <div class="portfolio-dash-header">
        <span class="mono">TOTAL VALUE</span>
        <strong>${formatINR(total)}</strong>
      </div>
      <div class="portfolio-dash-bars">
        ${Object.entries(alloc).map(([key, pct]) => `
          <div class="portfolio-dash-bar">
            <div class="portfolio-dash-fill" style="width:${pct}%"></div>
            <span class="mono">${key} <b>${pct}%</b></span>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (portfolioForm) {
    portfolioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) { showToast('Please log in first.', 'error'); return; }

      const btn = portfolioForm.querySelector('button[type="submit"]');
      const totalValue = parseFloat(portfolioForm.querySelector('[name="pf-total"]').value) || 0;
      const equity = parseFloat(portfolioForm.querySelector('[name="pf-equity"]').value) || 0;
      const debt = parseFloat(portfolioForm.querySelector('[name="pf-debt"]').value) || 0;
      const gold = parseFloat(portfolioForm.querySelector('[name="pf-gold"]').value) || 0;
      const cash = parseFloat(portfolioForm.querySelector('[name="pf-cash"]').value) || 0;
      const global = parseFloat(portfolioForm.querySelector('[name="pf-global"]').value) || 0;

      const sum = equity + debt + gold + cash + global;
      if (Math.abs(sum - 100) > 1) {
        showToast(`Allocations must total 100%. Current: ${sum}%`, 'error');
        return;
      }

      setLoading(btn, true);

      const allocation = { Equity: equity, Debt: debt, Gold: gold, Cash: cash, Global: global };

      const { data: existing } = await supabaseClient
        .from('portfolios')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabaseClient.from('portfolios').update({
          allocation,
          total_value: totalValue,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id));
      } else {
        ({ error } = await supabaseClient.from('portfolios').insert({
          user_id: currentUser.id,
          allocation,
          total_value: totalValue
        }));
      }

      setLoading(btn, false);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Portfolio saved!', 'success');
      loadPortfolio();
    });
  }

  /* ---------- Expose ---------- */
  window.arthxDashboard = { openDashboard, closeDashboard };
})();
