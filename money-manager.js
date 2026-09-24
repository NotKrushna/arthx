/* ============================================================
   MONEY MANAGER MODULE — arthX
   Handles Budgets. (Expenses handled by dashboard.js for now)
============================================================ */

(function () {
  'use strict';

  const budgetForm = document.getElementById('budgetForm');
  let currentUser = null;

  document.addEventListener('arthx:auth', (e) => {
    currentUser = e.detail.user;
  });

  if (budgetForm) {
    budgetForm.addEventListener('submit', async (e) => {
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

      const btn = budgetForm.querySelector('button[type="submit"]');
      const category = budgetForm.querySelector('[name="budget-category"]').value;
      const limit = parseFloat(budgetForm.querySelector('[name="budget-limit"]').value);

      if (!category || !limit) {
        if (window.showToast) window.showToast('Category and limit required.', 'error');
        return;
      }

      if (window.setLoading) window.setLoading(btn, true);

      // Upsert budget
      const { data: existing } = await supabaseClient
        .from('budgets')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('category', category)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabaseClient.from('budgets').update({
          monthly_limit: limit,
          created_at: new Date().toISOString()
        }).eq('id', existing.id));
      } else {
        ({ error } = await supabaseClient.from('budgets').insert({
          user_id: currentUser.id,
          category: category,
          monthly_limit: limit
        }));
      }

      if (window.setLoading) window.setLoading(btn, false);

      if (error) { 
        if (window.showToast) window.showToast(error.message, 'error'); 
        return; 
      }
      
      if (window.showToast) window.showToast('Budget set successfully!', 'success');
      budgetForm.reset();
    });
  }
})();
