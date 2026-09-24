/* ============================================================
   arthX ACADEMY MODULE
   Handles courses, XP, and badges.
============================================================ */

(function () {
  'use strict';

  const courseList = document.getElementById('academyCourseList');
  const xpDisplay = document.getElementById('academyXp');
  const rankDisplay = document.getElementById('academyRank');

  let currentUser = null;
  let userProgress = { total_xp: 0, completed_courses: [], badges: [] };

  document.addEventListener('arthx:auth', async (e) => {
    currentUser = e.detail.user;
    if (currentUser) {
      await loadAcademyData();
    }
  });

  async function loadAcademyData() {
    if (!courseList || !currentUser) return;

    // Load User Progress
    const { data: progressData, error: progressError } = await window.supabaseClient
      .from('user_progress')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (progressError) {
      console.error(progressError);
    } else if (progressData) {
      userProgress = progressData;
    }

    updateProgressUI();

    // Load Courses
    const { data: courses, error: coursesError } = await window.supabaseClient
      .from('academy_courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (coursesError) {
      courseList.innerHTML = '<p class="dash-empty mono">Could not load courses.</p>';
      return;
    }

    if (!courses || courses.length === 0) {
      courseList.innerHTML = '<p class="dash-empty mono">No courses available yet.</p>';
      return;
    }

    courseList.innerHTML = courses.map(course => {
      const isCompleted = userProgress.completed_courses.includes(course.id);
      
      return `
        <div class="app-card" style="display:flex; flex-direction:column; justify-content:space-between; ${isCompleted ? 'opacity:0.6;' : ''}">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span class="mono" style="color:var(--accent-purple); font-size:10px; text-transform:uppercase;">${course.difficulty}</span>
              <span class="mono" style="color:var(--accent-gold); font-size:10px;">+${course.xp_reward} XP</span>
            </div>
            <h3 style="margin-top:0; font-family:var(--font-serif); font-size:24px; color:var(--text-light);">${course.title}</h3>
            <p style="font-size:14px; line-height:1.5; color:var(--text-light); opacity:0.8;">${course.description}</p>
          </div>
          <button 
            class="dash-submit complete-course-btn" 
            data-id="${course.id}" 
            data-xp="${course.xp_reward}"
            style="margin-top:20px; ${isCompleted ? 'background:rgba(255,255,255,0.1); cursor:not-allowed;' : ''}"
            ${isCompleted ? 'disabled' : ''}
          >
            <span class="mono">${isCompleted ? 'COMPLETED ✓' : 'TAKE COURSE'}</span>
          </button>
        </div>
      `;
    }).join('');

    // Attach complete listeners
    const completeBtns = courseList.querySelectorAll('.complete-course-btn');
    completeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        
        // Disable temporarily
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="mono">COMPLETING...</span>';
        btn.disabled = true;
        
        await completeCourse(btn.dataset.id, parseInt(btn.dataset.xp, 10));
      });
    });
  }

  function updateProgressUI() {
    if (xpDisplay) xpDisplay.textContent = `${userProgress.total_xp} XP`;
    
    if (rankDisplay) {
      let rank = 'Novice';
      if (userProgress.total_xp >= 1000) rank = 'Master';
      else if (userProgress.total_xp >= 500) rank = 'Scholar';
      else if (userProgress.total_xp >= 150) rank = 'Apprentice';
      
      rankDisplay.textContent = rank;
    }
  }

  async function completeCourse(courseId, xpReward) {
    // Check if we need to insert or update
    const isNew = userProgress.id === undefined;
    
    const newXp = userProgress.total_xp + xpReward;
    const newCourses = [...userProgress.completed_courses, courseId];
    
    let error;
    if (isNew) {
      const res = await window.supabaseClient.from('user_progress').insert({
        user_id: currentUser.id,
        total_xp: newXp,
        completed_courses: newCourses
      }).select().single();
      error = res.error;
      if (res.data) userProgress = res.data;
    } else {
      const res = await window.supabaseClient.from('user_progress').update({
        total_xp: newXp,
        completed_courses: newCourses,
        updated_at: new Date().toISOString()
      }).eq('id', userProgress.id).select().single();
      error = res.error;
      if (res.data) userProgress = res.data;
    }

    if (error) {
      if (window.showToast) window.showToast('Error completing course.', 'error');
      console.error(error);
      // Re-enable button on error
      await loadAcademyData();
      return;
    }

    if (window.showToast) window.showToast(`Course completed! +${xpReward} XP earned.`, 'success');
    
    // Refresh UI
    updateProgressUI();
    loadAcademyData();
  }

})();
