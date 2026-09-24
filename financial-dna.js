/* ============================================================
   FINANCIAL DNA MODULE — arthX
   Handles Risk and Liquidity profiling.
============================================================ */

(function () {
  'use strict';

  const dnaForm = document.getElementById('dnaForm');
  const dnaDisplay = document.getElementById('dnaDisplay');
  let currentUser = null;

  document.addEventListener('arthx:auth', (e) => {
    currentUser = e.detail.user;
    if (currentUser) {
      loadFinancialDNA();
    }
  });

  async function loadFinancialDNA() {
    if (!dnaDisplay || !currentUser) return;

    const { data, error } = await supabaseClient
      .from('financial_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data && dnaForm) {
      // Pre-fill form with existing DNA
      const riskSelect = dnaForm.querySelector('[name="dna-risk"]');
      const liquiditySelect = dnaForm.querySelector('[name="dna-liquidity"]');
      const horizonInput = dnaForm.querySelector('[name="dna-horizon"]');
      const incomeInput = dnaForm.querySelector('[name="dna-income"]');
      const goalInput = dnaForm.querySelector('[name="dna-goal"]');

      if (riskSelect && data.risk_tolerance) riskSelect.value = data.risk_tolerance;
      if (liquiditySelect && data.liquidity_need) liquiditySelect.value = data.liquidity_need;
      if (horizonInput && data.investment_horizon_years) horizonInput.value = data.investment_horizon_years;
      if (incomeInput && data.monthly_income) incomeInput.value = data.monthly_income;
      if (goalInput && data.primary_goal) goalInput.value = data.primary_goal;
      
      dnaDisplay.innerHTML = `<p class="dash-empty mono" style="color:var(--accent-gold)">DNA Profile Active: ${data.risk_tolerance.toUpperCase()} risk</p>`;
    }
  }

  if (dnaForm) {
    dnaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) { 
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          currentUser = session.user;
        } else {
          if (window.showToast) window.showToast('Please log in first.', 'error'); 
          return; 
        }
      }

      const btn = dnaForm.querySelector('button[type="submit"]');
      const risk = dnaForm.querySelector('[name="dna-risk"]').value;
      const liquidity = dnaForm.querySelector('[name="dna-liquidity"]').value;
      const horizon = parseInt(dnaForm.querySelector('[name="dna-horizon"]').value, 10);
      const income = parseFloat(dnaForm.querySelector('[name="dna-income"]').value) || 0;
      const goal = dnaForm.querySelector('[name="dna-goal"]').value;

      if (!risk || !liquidity || isNaN(horizon)) {
        if (window.showToast) window.showToast('Please fill required fields.', 'error');
        return;
      }

      if (window.setLoading) window.setLoading(btn, true);

      const { data: existing } = await supabaseClient
        .from('financial_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabaseClient.from('financial_profiles').update({
          risk_tolerance: risk,
          liquidity_need: liquidity,
          investment_horizon_years: horizon,
          monthly_income: income,
          primary_goal: goal,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id));
      } else {
        ({ error } = await supabaseClient.from('financial_profiles').insert({
          user_id: currentUser.id,
          risk_tolerance: risk,
          liquidity_need: liquidity,
          investment_horizon_years: horizon,
          monthly_income: income,
          primary_goal: goal
        }));
      }

      if (window.setLoading) window.setLoading(btn, false);

      if (error) { 
        if (window.showToast) window.showToast(error.message, 'error'); 
        return; 
      }
      
      if (window.showToast) window.showToast('Financial DNA saved!', 'success');
      loadFinancialDNA();
    });
  }
})();
