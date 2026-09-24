gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   BRAND ORBIT — GSAP-controlled SVG rotation
   CSS transforms on SVG <g> elements are inconsistent across
   browsers. Rotate only the orbit group; the center mark stays
   completely stationary because it is outside this group.
============================================================ */
const brandOrbit = document.querySelector('.brand-orbit');
if(brandOrbit){
  gsap.set(brandOrbit, {transformOrigin:'50% 50%'});
  gsap.to(brandOrbit, {
    rotation:360,
    duration:7.5,
    repeat:-1,
    ease:'none'
  });
}

/* ============================================================
   0. SHARED HELPERS
============================================================ */

/* A tall image canvas that translates vertically as the page scrolls,
   reused by both the Hero (background.png) and the Image 02 journey
   (background2.png) so the two feel like the same cinematic system
   rather than two different implementations. */
function createVerticalPan(canvas){
  function travel(){
    return Math.max(0, canvas.offsetHeight - innerHeight);
  }
  return {
    travel,
    apply(progress){
      gsap.set(canvas, { y: -travel() * progress });
    }
  };
}

/* ============================================================
   1. PRELOADER (ERA-STYLE)
============================================================ */
const preloader = document.getElementById('door-screen');
const masterPreloader = document.getElementById('masterPreloader');
const loadFill = document.getElementById('loadFill');

document.documentElement.style.overflow = 'hidden';
document.body.style.overflow = 'hidden';

// Reset load bar
gsap.set(loadFill, { xPercent: -100 });

// Animate load bar
gsap.to(loadFill, {
  xPercent: 0,
  duration: 1.8,
  ease: 'power2.inOut',
  onComplete() {
    gsap.timeline({
      onComplete() {
        if(preloader) preloader.style.display = 'none';
        if(masterPreloader) masterPreloader.style.display = 'none';
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        ScrollTrigger.refresh(true);
      }
    })
    .to(preloader, { opacity: 0, duration: 0.8, ease: 'power2.out' })
    .to(masterPreloader, { yPercent: -100, duration: 1.2, ease: 'power3.inOut' }, "-=0.4");
  }
});

/* ============================================================
   2. NAVIGATION
   - persistent minimal nav, colour adapts per section (no panel)
   - full-screen menu overlay with expandable groups
   - era-style scroll indicator (independent of the logo)
============================================================ */
const navEl = document.getElementById('siteNav');
const scrollIndicatorEl = document.getElementById('scrollIndicator');
const scrollIndicatorValue = document.getElementById('scrollIndicatorValue');
const scrollIndicatorFill = document.getElementById('scrollIndicatorFill');

const navSections = [...document.querySelectorAll('[data-nav-mode]')];

function setNavMode(mode, index){
  const isDark = mode === 'dark';
  navEl.classList.toggle('nav-mode-dark', isDark);
  scrollIndicatorEl.classList.toggle('nav-mode-dark', isDark);
  if(index != null){
    scrollIndicatorValue.textContent = String(index + 1).padStart(2,'0');
  }
}

navSections.forEach((sec, i)=>{
  ScrollTrigger.create({
    trigger: sec,
    start: 'top top+=90',
    end: 'bottom top+=90',
    onEnter: () => setNavMode(sec.dataset.navMode, i),
    onEnterBack: () => setNavMode(sec.dataset.navMode, i),
  });
});
setNavMode(navSections[0]?.dataset.navMode || 'light', 0);

// index used so the enterprise reveal can keep re-asserting the correct
// nav colour as it scrubs, without a second/competing navigation system
const enterpriseNavIndex = navSections.findIndex(s => s.id === 'enterprise');

function updateScrollIndicatorFill(){
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  scrollIndicatorFill.style.height = `${p * 100}%`;
}
addEventListener('scroll', updateScrollIndicatorFill, {passive:true});
addEventListener('resize', updateScrollIndicatorFill);
updateScrollIndicatorFill();

/* --- full-screen menu overlay --- */
const menuTrigger = document.getElementById('menuTrigger');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');
const menuItems = [...document.querySelectorAll('.menu-list > ul > li')];

function openMenu(){
  menuOverlay.classList.add('is-open');
  menuOverlay.setAttribute('aria-hidden','false');
  menuTrigger.setAttribute('aria-expanded','true');
  document.body.style.overflow = 'hidden';

  gsap.set(menuItems,{opacity:0,y:22});
  gsap.timeline({onComplete(){ menuClose.focus(); }})
    .to(menuOverlay,{autoAlpha:1,duration:.6,ease:'power3.out'})
    .to(menuItems,{opacity:1,y:0,duration:.7,ease:'expo.out',stagger:.045},'-=.3');
}

function closeMenu(){
  gsap.to(menuOverlay,{
    autoAlpha:0,
    duration:.45,
    ease:'power2.inOut',
    onComplete(){
      menuOverlay.classList.remove('is-open');
      menuOverlay.setAttribute('aria-hidden','true');
      menuTrigger.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      menuTrigger.focus();
    }
  });
}

menuTrigger.addEventListener('click', openMenu);
menuClose.addEventListener('click', closeMenu);

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && menuOverlay.classList.contains('is-open')){
    closeMenu();
  }
});

document.querySelectorAll('.menu-group-toggle').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const group = btn.closest('.menu-group');
    const willOpen = !group.classList.contains('open');
    group.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));
  });
});

// close the menu on link click (in-page anchors) so the destination is visible
document.querySelectorAll('.menu-item a, .menu-sub-wrap a').forEach(a=>{
  a.addEventListener('click', ()=>{
    if(menuOverlay.classList.contains('is-open')) closeMenu();
  });
});

/* ============================================================
   3. HERO — IMAGE 01 (background.png)
   image never zooms — the tall canvas translates vertically
   while text is pinned to the viewport
============================================================ */
const heroCanvas = document.getElementById('heroCanvas');
const heroImage = document.getElementById('heroImage');
const heroSteps = [...document.querySelectorAll('.hero-copy-step')];
const heroPan = createVerticalPan(heroCanvas);

ScrollTrigger.create({
  trigger:'#heroStory',
  start:'top top',
  end:'bottom bottom',
  scrub:1,
  onUpdate(self){
    heroPan.apply(self.progress);

    // 5 copy stages distributed through the first ~72% of the image journey
    const copyProgress = Math.min(self.progress / .72, .9999);
    const idx = Math.min(heroSteps.length-1, Math.floor(copyProgress * heroSteps.length));
    heroSteps.forEach((el,i)=>el.classList.toggle('active',i===idx));
  }
});
heroImage.addEventListener('load',()=>ScrollTrigger.refresh());

/* ============================================================
   4. HERO HOTSPOTS — live inside heroCanvas, travel with the photo
============================================================ */
const hotspotData = {
  1:{
    kicker:'01 — FOUNDATION',
    title:'Build Your Financial Foundation',
    text:'Understand your income, spending, savings, risk and financial position before making bigger decisions.'
  },
  2:{
    kicker:'02 — MANAGE',
    title:'Manage Your Money',
    text:'Bring income, spending, saving, investing and financial planning into one system.'
  },
  3:{
    kicker:'03 — GROW',
    title:'Grow Your Wealth',
    text:'Build portfolios, analyze investments and explore opportunities that align with your goals.'
  }
};

const hotspotCard = document.getElementById('hotspotCard');
const hotspotKicker = document.getElementById('hotspotKicker');
const hotspotTitle = document.getElementById('hotspotTitle');
const hotspotText = document.getElementById('hotspotText');
const hotspotButtons = [...document.querySelectorAll('.hero-hotspot')];

hotspotButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    const id = btn.dataset.hotspot;
    const alreadyActive = btn.classList.contains('active');

    if(alreadyActive){
      btn.classList.remove('active');
      hotspotCard.classList.remove('visible');
      return;
    }

    const d = hotspotData[id];
    hotspotButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    hotspotKicker.textContent = d.kicker;
    hotspotTitle.textContent = d.title;
    hotspotText.textContent = d.text;
    hotspotCard.classList.add('visible');
  });
});

/* ============================================================
   5. WHY arthX — CIRCLE, THEN THE CIRCLE BECOMES IMAGE 02
   One pinned ScrollTrigger drives every phase:
     0    → .26  circle rises from below and grows to full coverage
     .05  → .26  "3 REASONS" title fades in, then out
     .28  → .86  the 3 reason cards cycle, one at a time
   Reasons then transitions directly into Image 02's own journey,
   which continues immediately after in #imageTwo.
============================================================ */
const reasonsCircle = document.getElementById('reasonsCircle');
const circleTitle = document.querySelector('.circle-title');
const reasonStage = document.getElementById('reasonStage');
const reasonCards = [...document.querySelectorAll('.reason-card')];

gsap.set(reasonsCircle,{xPercent:-50, yPercent:-50, y:'55vh', scale:.05});

ScrollTrigger.create({
  trigger:'#reasons',
  start:'top top',
  end:'bottom bottom',
  scrub:1,
  onUpdate(self){
    const p = self.progress;

    // phase 1 — circle rises + grows to full coverage (0 → .26)
    // scale tops out just past 1 on a 160vmax base — see the CSS comment
    // on .reasons-circle for why that margin matters (corner coverage).
    const grow = Math.min(1, p / .26);
    gsap.set(reasonsCircle,{
      scale: .04 + grow * 0.98,
      y: `${55 - grow * 55}vh`
    });

    // "3 REASONS" title (.05 → .26)
    let titleOpacity = 0;
    if(p > .05 && p <= .15) titleOpacity = Math.min(1, (p - .05) / .10);
    else if(p > .15 && p <= .26) titleOpacity = Math.max(0, 1 - (p - .15) / .11);
    gsap.set(circleTitle,{opacity:titleOpacity});

    // phase 2 — the reason cards (.28 → .86)
    let stageOpacity = 0;
    if(p > .28 && p <= .34) stageOpacity = (p - .28) / .06;
    else if(p > .34 && p <= .82) stageOpacity = 1;
    else if(p > .82 && p <= .90) stageOpacity = Math.max(0, 1 - (p - .82) / .08);
    gsap.set(reasonStage,{opacity: stageOpacity});

    if(p > .28 && p <= .86){
      const local = Math.min(.9999, Math.max(0, (p - .34) / .48));
      const idx = Math.max(0, Math.min(2, Math.floor(local * 3)));
      reasonCards.forEach((card,i)=>card.classList.toggle('active', i===idx));
    }
  }
});

/* ============================================================
   6. IMAGE 02 JOURNEY (background2.png)
   Same vertical-pan language as the hero — the site's ONE image
   sequence system, reused rather than reinvented — but shorter,
   so it reads as a continuation, not a repeat of the hero.
============================================================ */
const imageTwoCanvas = document.getElementById('imageTwoCanvas');
const imageTwoImage = document.getElementById('imageTwoImage');
const imageTwoText = document.getElementById('imageTwoText');
const imageTwoIndex = document.getElementById('imageTwoIndex');
const imageTwoPan = createVerticalPan(imageTwoCanvas);

const imageTwoStates = [
  'A city built on markets, tides and momentum.',
  'Skyline in motion — growth stacked on growth.',
  'Where capital meets the coastline.',
  'Every tower, a decision compounding.',
  'The horizon keeps extending. So can your plan.'
];

ScrollTrigger.create({
  trigger:'#imageTwo',
  start:'top top',
  end:'bottom bottom',
  scrub:1,
  onUpdate(self){
    imageTwoPan.apply(self.progress);
    const idx = Math.min(imageTwoStates.length-1, Math.floor(self.progress * imageTwoStates.length));
    if(imageTwoText) imageTwoText.textContent = imageTwoStates[idx];
    if(imageTwoIndex) imageTwoIndex.textContent = `02 / ${String(idx+1).padStart(2,'0')}`;
  }
});
imageTwoImage.addEventListener('load',()=>ScrollTrigger.refresh());

/* ============================================================
   7. GENERIC SCROLL REVEALS
   One shared IntersectionObserver drives every editorial section
   (Learn, Build, Intelligence, Market, FINY, Personal, Philosophy,
   Final) — a single orchestrated reveal system rather than a
   scroll listener per element.
============================================================ */
const revealEls = document.querySelectorAll('[data-reveal]');
if('IntersectionObserver' in window){
  const revealIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealIO.unobserve(entry.target);
      }
    });
  }, {threshold:.2, rootMargin:'0px 0px -8% 0px'});
  revealEls.forEach(el=>revealIO.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in-view'));
}

/* ============================================================
   8. FINANCIAL JOURNEY — active step follows scroll position
============================================================ */
const journeySteps = [...document.querySelectorAll('.journey-step')];
if('IntersectionObserver' in window && journeySteps.length){
  const journeyIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      entry.target.classList.toggle('active', entry.isIntersecting);
    });
  }, {threshold:0, rootMargin:'-45% 0px -45% 0px'});
  journeySteps.forEach(step=>journeyIO.observe(step));
}

/* ============================================================
   9. ENTERPRISE — IMAGE 03 REVEAL (background3.png)
   A single pinned scrub: the environment fades in first, then the
   institutional content slides in over it. One reveal system, not
   a second portal.
============================================================ */
const enterpriseImage = document.getElementById('enterpriseImage');
const enterpriseContent = document.getElementById('enterpriseContent');

ScrollTrigger.create({
  trigger:'#enterprise',
  start:'top top',
  end:'bottom bottom',
  scrub:1,
  onUpdate(self){
    const p = self.progress;
    const imgOpacity = Math.min(1, p / .28);
    gsap.set(enterpriseImage,{opacity:imgOpacity});
    enterpriseContent.classList.toggle('in-view', p > .32);

    if(enterpriseNavIndex > -1){
      setNavMode('light', enterpriseNavIndex);
    }
  }
});

/* ============================================================
   10. RESPONSIVE HANDLING
============================================================ */
addEventListener('resize', ()=>{
  ScrollTrigger.refresh();
});

addEventListener('load', ()=>ScrollTrigger.refresh());

const mobileQuery = matchMedia('(max-width:900px)');
mobileQuery.addEventListener('change', ()=>{
  if(menuOverlay.classList.contains('is-open')) closeMenu();
});
