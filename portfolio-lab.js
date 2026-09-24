/* ============================================================
   PORTFOLIO LAB MODULE — arthX
   Compound growth simulations.
============================================================ */

(function () {
  'use strict';

  const labForm = document.getElementById('labForm');
  const labFutureValue = document.getElementById('labFutureValue');
  const labChart = document.getElementById('labChart');

  if (labForm) {
    labForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const initial = parseFloat(labForm.querySelector('[name="lab-initial"]').value) || 0;
      const monthly = parseFloat(labForm.querySelector('[name="lab-monthly"]').value) || 0;
      const years = parseInt(labForm.querySelector('[name="lab-years"]').value, 10);
      const rate = parseFloat(labForm.querySelector('[name="lab-rate"]').value) || 0;

      if (isNaN(years) || years <= 0) return;

      // Compound interest math
      const months = years * 12;
      const monthlyRate = rate / 100 / 12;
      
      let futureValue = initial;
      let totalInvested = initial;

      for (let i = 0; i < months; i++) {
        futureValue = (futureValue + monthly) * (1 + monthlyRate);
        totalInvested += monthly;
      }

      if (labFutureValue && window.formatINR) {
        labFutureValue.textContent = window.formatINR(futureValue);
      }

      if (labChart && window.formatINR) {
        const wealthGained = futureValue - totalInvested;
        labChart.innerHTML = `
          <div style="display:flex; justify-content:space-around; align-items:flex-end; height:150px; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px;">
            <div style="text-align:center;">
              <div style="height:50px; width:40px; background:var(--accent-silver); margin:0 auto;"></div>
              <span class="mono" style="font-size:10px; display:block; margin-top:5px;">INVESTED</span>
              <strong style="font-size:12px;">${window.formatINR(totalInvested)}</strong>
            </div>
            <div style="text-align:center;">
              <div style="height:120px; width:40px; background:var(--accent-purple); margin:0 auto;"></div>
              <span class="mono" style="font-size:10px; display:block; margin-top:5px;">RETURNS</span>
              <strong style="font-size:12px;">${window.formatINR(wealthGained)}</strong>
            </div>
            <div style="text-align:center;">
              <div style="height:150px; width:40px; background:var(--accent-gold); margin:0 auto;"></div>
              <span class="mono" style="font-size:10px; display:block; margin-top:5px;">TOTAL</span>
              <strong style="font-size:12px;">${window.formatINR(futureValue)}</strong>
            </div>
          </div>
        `;
      }
    });
  }
})();
