/* ============================================================
   FINY AI MODULE — arthX
   Simulated AI Chat Interface & Context Awareness
============================================================ */

(function () {
  'use strict';

  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatHistory = document.getElementById('chatHistory');
  let currentUser = null;
  
  // To make the AI feel real, we'll fetch the user's net worth as context
  let userNetWorthContext = null;

  document.addEventListener('arthx:auth', async (e) => {
    currentUser = e.detail.user;
    if (currentUser) {
      // Fetch context silently in background
      const { data } = await window.supabaseClient
        .from('net_worth')
        .select('net_worth')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) userNetWorthContext = data.net_worth;
    }
  });

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const query = chatInput.value.trim();
      if (!query) return;

      if (!currentUser) {
        if (window.showToast) window.showToast('Please log in first.', 'error');
        return;
      }

      // 1. Append User Bubble
      appendMessage(query, 'user');
      chatInput.value = '';
      
      // 2. Loading State
      const btn = chatForm.querySelector('button[type="submit"]');
      if (window.setLoading) window.setLoading(btn, true);
      chatInput.disabled = true;

      // 3. Simulate Network Delay for LLM inference (1.5 seconds)
      setTimeout(() => {
        // 4. Generate contextual response
        let aiResponse = "I'm currently running in Demo Mode. To connect me to a real LLM like OpenAI or Gemini, you'll need to deploy a Supabase Edge Function.";
        let citations = [];

        const lowerQ = query.toLowerCase();
        
        if (lowerQ.includes('net worth') || lowerQ.includes('how much do i have') || lowerQ.includes('my money')) {
          if (userNetWorthContext !== null) {
            aiResponse = `Based on your dashboard data, your current calculated Net Worth is **${window.formatINR ? window.formatINR(userNetWorthContext) : userNetWorthContext}**. Would you like me to suggest some rebalancing strategies in the Portfolio Lab?`;
            citations.push({ source: 'arthX Internal DB', path: 'net_worth table' });
          } else {
            aiResponse = "You haven't filled out your Assets and Liabilities yet. Please go to the Net Worth tab so I can analyze your financial position!";
          }
        } 
        else if (lowerQ.includes('dsr') || lowerQ.includes('dscr') || lowerQ.includes('loan') || lowerQ.includes('business')) {
          aiResponse = "A healthy Debt Service Coverage Ratio (DSCR) for a rural enterprise is typically 1.25x or higher. This means your Net Operating Income is 125% of your debt obligations. You can model this exactly in our Enterprise Advisor tab.";
          citations.push({ source: 'FINY Academy', path: 'Rural Enterprise Finance Module' });
          citations.push({ source: 'Investopedia', path: 'https://www.investopedia.com/terms/d/dscr.asp' });
        }
        else if (lowerQ.includes('hello') || lowerQ.includes('hi')) {
          aiResponse = "Hello! I am FINY. I'm connected to your financial data and our secure knowledge base. How can I assist you today?";
        }
        else {
          aiResponse = `That's a great question about "${query}". I can help you analyze risk and project compound growth. Just let me know what specific assets you're looking at.`;
        }

        // 5. Append AI Bubble with Evidence Layer
        appendMessage(aiResponse, 'ai', citations);
        
        if (window.setLoading) window.setLoading(btn, false);
        chatInput.disabled = false;
        chatInput.focus();
      }, 1500);
    });
  }

  function appendMessage(text, sender, citations = []) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '15px';
    wrapper.style.maxWidth = '80%';
    wrapper.style.marginBottom = '20px';
    
    if (sender === 'user') {
      wrapper.style.alignSelf = 'flex-end';
      wrapper.style.flexDirection = 'row-reverse';
    }

    let avatar = '';
    if (sender === 'ai') {
      avatar = `<div style="width:30px; height:30px; border-radius:50%; background:var(--accent-gold); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:var(--font-serif); color:var(--bg-dark); font-weight:bold;">F</div>`;
    } else {
      avatar = `<div style="width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:var(--font-serif); color:var(--text-light); font-weight:bold;">U</div>`;
    }

    // Format basic bold markdown for demo
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    let citationsHTML = '';
    if (citations.length > 0) {
      citationsHTML = `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; opacity:0.7;">
        <span class="mono" style="display:block; margin-bottom:5px; color:var(--accent-silver);">EVIDENCE / SOURCES</span>
        ${citations.map(c => `<div style="margin-bottom:3px;">• ${c.source} <span style="opacity:0.5;">(${c.path})</span></div>`).join('')}
      </div>`;
    }

    const bubbleColor = sender === 'ai' ? 'rgba(255,255,255,0.05)' : 'rgba(139, 92, 246, 0.2)';
    const borderRadius = sender === 'ai' ? '0 8px 8px 8px' : '8px 0 8px 8px';

    const bubble = `
      <div style="background:${bubbleColor}; padding:15px; border-radius:${borderRadius}; font-size:14px; line-height:1.5;">
        ${formattedText}
        ${citationsHTML}
      </div>
    `;

    wrapper.innerHTML = sender === 'ai' ? avatar + bubble : avatar + bubble;
    chatHistory.appendChild(wrapper);
    
    // Auto scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

})();
