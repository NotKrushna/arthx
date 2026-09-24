/* ============================================================
   SUPABASE CLIENT — arthX Backend
   Initializes the Supabase JS client and exposes shared helpers.
   Loaded AFTER the Supabase CDN script in index.html.
============================================================ */

const SUPABASE_URL  = 'https://jwtrbxbljmoswuyzsxqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dHJieGJsam1vc3d1eXpzeHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDM1ODQsImV4cCI6MjEwNDAxOTU4NH0.UaGEl6ICHr9-8jYbCUP9pI2mgNs-KYZHxg5DNEN1kzo';

// Global Supabase client — used by auth.js, dashboard.js, content.js
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ---------- Toast notification system ---------- */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `arthx-toast arthx-toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ---------- Loading state helpers ---------- */
function setLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle('is-loading', loading);
}

/* ---------- Format currency (INR) ---------- */
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ---------- Format date ---------- */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

console.log('✅ Supabase client initialized — arthX backend ready');
