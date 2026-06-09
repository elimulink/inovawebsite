/* ============================================================
   InovaRoute – main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. NAVBAR – scroll effect + active section + mobile drawer
     ---------------------------------------------------------- */
  const navbar   = document.getElementById('navbar');
  const navLinks = document.getElementById('nav-links');
  const navToggle = document.getElementById('nav-toggle');
  const allNavLinks = navLinks ? navLinks.querySelectorAll('.nav-link') : [];

  // Scroll: add .scrolled class
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    highlightActiveSection();
  }, { passive: true });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
      });
    });
  }

  // Active section highlight
  const sections = document.querySelectorAll('section[id], div[id]');

  function highlightActiveSection() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    allNavLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }


  /* ----------------------------------------------------------
     2. SCROLL REVEAL – fade-up on every .fade-up element
     ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  fadeEls.forEach(el => revealObserver.observe(el));


  /* ----------------------------------------------------------
     3. COUNTER ANIMATIONS – stat numbers count up when visible
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const start = performance.now();
    const suffix = el.dataset.suffix || '';

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));


  /* ----------------------------------------------------------
     4. HERO MAP ANIMATION – draw route + move marker on loop
     ---------------------------------------------------------- */
  const heroRoute  = document.getElementById('hero-route');
  const heroMarker = document.getElementById('hero-moving-marker');
  const heroBatt   = document.getElementById('heroBattFill');

  if (heroRoute && heroMarker) {
    // Fix dash array to actual path length
    const len = heroRoute.getTotalLength();
    heroRoute.style.strokeDasharray  = len;
    heroRoute.style.strokeDashoffset = len;

    // Trigger route draw via CSS animation restart
    heroRoute.style.animation = 'none';
    heroRoute.getBoundingClientRect(); // reflow
    heroRoute.style.animation = `drawRoute 1.8s ease-out 0.6s forwards`;

    // Move marker after route is drawn
    let markerRaf = null;

    function animateHeroMarker() {
      heroMarker.setAttribute('opacity', '1');
      const duration = 2200;
      const start = performance.now();

      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pt = heroRoute.getPointAtLength(eased * len);
        heroMarker.setAttribute('cx', pt.x);
        heroMarker.setAttribute('cy', pt.y);
        if (t < 1) {
          markerRaf = requestAnimationFrame(step);
        } else {
          // Pulse at destination then reset after pause
          setTimeout(resetHeroAnimation, 2500);
        }
      }
      markerRaf = requestAnimationFrame(step);
    }

    function resetHeroAnimation() {
      if (markerRaf) cancelAnimationFrame(markerRaf);
      heroMarker.setAttribute('opacity', '0');
      heroRoute.style.animation = 'none';
      heroRoute.getBoundingClientRect();
      heroRoute.style.strokeDashoffset = len;

      setTimeout(() => {
        heroRoute.style.animation = `drawRoute 1.8s ease-out 0.3s forwards`;
        setTimeout(animateHeroMarker, 2200);
      }, 600);
    }

    // Start after first draw completes
    setTimeout(animateHeroMarker, 2600);
  }

  // Battery fill animation (delayed)
  if (heroBatt) {
    setTimeout(() => { heroBatt.style.width = '72%'; }, 2800);
  }


  /* ----------------------------------------------------------
     5. INDUSTRY CARDS – click to flip on touch devices
     ---------------------------------------------------------- */
  document.querySelectorAll('.industry-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter' || e.key === ' ') card.classList.toggle('flipped');
    });
  });


  /* ----------------------------------------------------------
     6. INTERACTIVE DEMO – floor plan + routing simulation
     ---------------------------------------------------------- */
  const demoSvg     = document.getElementById('demo-svg');
  const floorTabs   = document.querySelectorAll('.floor-tab');
  const demoDestSel = document.getElementById('demoDest');
  const demoFindBtn = document.getElementById('demoFindBtn');
  const demoResult  = document.getElementById('demoResult');
  const demoEta     = document.getElementById('demoEta');
  const demoDist    = document.getElementById('demoDist');
  const demoOriginLabel = document.getElementById('demoOriginLabel');

  const FLOORS = {
    1: {
      label: 'Ground Floor · Hospital',
      origin: { id: 'entrance', label: 'Main Entrance' },
      rooms: [
        { id: 'entrance',  label: 'Main Entrance', x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'reception', label: 'Reception',     x: 185, y: 168, w: 105, h: 70 },
        { id: 'pharmacy',  label: 'Pharmacy',      x: 20,  y: 168, w: 100, h: 70 },
        { id: 'emergency', label: 'Emergency',     x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'cafeteria', label: 'Cafeteria',     x: 185, y: 40,  w: 105, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
    2: {
      label: 'First Floor · Hospital',
      origin: { id: 'lift', label: 'Main Lift' },
      rooms: [
        { id: 'lift',      label: 'Main Lift',  x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'ward-a',    label: 'Ward A',     x: 20,  y: 168, w: 100, h: 70 },
        { id: 'ward-b',    label: 'Ward B',     x: 185, y: 168, w: 105, h: 70 },
        { id: 'icu',       label: 'ICU',        x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'radiology', label: 'Radiology',  x: 185, y: 40,  w: 105, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
  };

  let currentFloor  = 1;
  let selectedDest  = null;
  let demoAnimFrame = null;
  let demoRoutePath = null;
  let demoMovingDot = null;

  function getCenter(room) {
    return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
  }

  function buildRouteD(fromRoom, toRoom, plan) {
    const f  = getCenter(fromRoom);
    const t  = getCenter(toRoom);
    const cy = plan.corridorY + plan.corridorH / 2;
    return `M ${f.x} ${f.y} L ${f.x} ${cy} L ${t.x} ${cy} L ${t.x} ${t.y}`;
  }

  function routeLength(fromRoom, toRoom, plan) {
    const f  = getCenter(fromRoom);
    const t  = getCenter(toRoom);
    const cy = plan.corridorY + plan.corridorH / 2;
    return Math.abs(f.y - cy) + Math.abs(f.x - t.x) + Math.abs(t.y - cy);
  }

  function renderFloor(floorNum, destId) {
    const plan = FLOORS[floorNum];
    if (!plan || !demoSvg) return;

    let html = `
      <text x="240" y="26" fill="rgba(0,212,255,0.6)" font-size="9"
        font-family="Poppins,sans-serif" font-weight="700" letter-spacing="1.8"
        text-anchor="middle">${plan.label.toUpperCase()}</text>
      <rect x="14" y="${plan.corridorY}" width="452" height="${plan.corridorH}" rx="3"
        fill="rgba(0,212,255,0.07)" stroke="rgba(0,212,255,0.2)" stroke-width="1"/>
      <text x="240" y="${plan.corridorY + plan.corridorH / 2 + 3.5}"
        fill="rgba(0,212,255,0.4)" font-size="6.5" font-family="Poppins,sans-serif"
        text-anchor="middle" letter-spacing="2.5" font-weight="600">CORRIDOR</text>
    `;

    plan.rooms.forEach(room => {
      const cx = room.x + room.w / 2;
      const cy = room.y + room.h / 2;
      const isOrigin = room.isOrigin;
      const isDest   = room.id === destId;

      let fill, stroke, textCol, sw;
      if (isOrigin) {
        fill = 'rgba(0,212,255,0.2)'; stroke = 'rgba(0,212,255,0.75)';
        textCol = '#00d4ff'; sw = 2;
      } else if (isDest) {
        fill = 'rgba(15,184,160,0.2)'; stroke = 'rgba(15,184,160,0.75)';
        textCol = '#0fb8a0'; sw = 2;
      } else {
        fill = 'rgba(255,255,255,0.07)'; stroke = 'rgba(120,170,220,0.45)';
        textCol = 'rgba(255,255,255,0.72)'; sw = 1;
      }

      html += `
        <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="6"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${cx}" y="${cy - (isOrigin || isDest ? 8 : 0)}"
          fill="${textCol}" font-size="10" font-family="Poppins,sans-serif"
          text-anchor="middle" dominant-baseline="middle"
          font-weight="${isOrigin || isDest ? '700' : '500'}">${room.label}</text>
      `;
      if (isOrigin) html += `<text x="${cx}" y="${cy + 10}" fill="rgba(0,212,255,0.65)" font-size="7.5" font-family="Poppins,sans-serif" text-anchor="middle" font-weight="600">You are here</text>`;
      if (isDest)   html += `<text x="${cx}" y="${cy + 10}" fill="rgba(15,184,160,0.7)" font-size="7.5" font-family="Poppins,sans-serif" text-anchor="middle" font-weight="600">Destination</text>`;
    });

    // Origin marker
    const origin = plan.rooms.find(r => r.isOrigin);
    const oc = getCenter(origin);
    html += `
      <circle cx="${oc.x}" cy="${oc.y}" r="14" fill="rgba(0,212,255,0.08)" class="pulse-outer"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="8"  fill="rgba(0,212,255,0.2)"  class="pulse-inner"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="5"  fill="#00d4ff" filter="url(#demoGlow)"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="2.5" fill="white"/>
    `;

    if (destId) {
      const dest = plan.rooms.find(r => r.id === destId);
      const dc = getCenter(dest);
      html += `<circle cx="${dc.x}" cy="${dc.y}" r="6" fill="#0fb8a0" filter="url(#demoGlow)"/><circle cx="${dc.x}" cy="${dc.y}" r="3" fill="white"/>`;
    }

    // Placeholders for animated elements
    html += `<path id="demo-route-path" fill="none" stroke="url(#demoRouteGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d=""/>`;
    html += `<circle id="demo-moving-dot" cx="-20" cy="-20" r="5.5" fill="white" filter="url(#demoGlow)"/>`;

    demoSvg.innerHTML = demoSvg.querySelector('defs').outerHTML + html;
    demoRoutePath = document.getElementById('demo-route-path');
    demoMovingDot = document.getElementById('demo-moving-dot');
  }

  function populateDestOptions(floorNum) {
    const plan = FLOORS[floorNum];
    if (!demoDestSel) return;
    demoDestSel.innerHTML = '<option value="">Select destination…</option>';
    plan.rooms.filter(r => !r.isOrigin).forEach(room => {
      const opt = document.createElement('option');
      opt.value = room.id;
      opt.textContent = room.label;
      demoDestSel.appendChild(opt);
    });
    if (demoOriginLabel) demoOriginLabel.textContent = plan.origin.label;
    selectedDest = null;
    if (demoFindBtn) demoFindBtn.disabled = true;
    if (demoResult) demoResult.style.display = 'none';
  }

  // Floor tab switching
  floorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      floorTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFloor = parseInt(tab.dataset.floor, 10);
      selectedDest = null;
      if (demoFindBtn) demoFindBtn.disabled = true;
      if (demoResult) demoResult.style.display = 'none';
      populateDestOptions(currentFloor);
      renderFloor(currentFloor, null);
    });
  });

  // Destination selection
  if (demoDestSel) {
    demoDestSel.addEventListener('change', () => {
      selectedDest = demoDestSel.value || null;
      if (demoFindBtn) demoFindBtn.disabled = !selectedDest;
      if (demoResult)  demoResult.style.display = 'none';
      if (demoAnimFrame) cancelAnimationFrame(demoAnimFrame);
      renderFloor(currentFloor, selectedDest);
    });
  }

  // Find route
  if (demoFindBtn) {
    demoFindBtn.addEventListener('click', () => {
      if (!selectedDest) return;
      const plan   = FLOORS[currentFloor];
      const origin = plan.rooms.find(r => r.isOrigin);
      const dest   = plan.rooms.find(r => r.id === selectedDest);
      if (!origin || !dest) return;

      const pathD = buildRouteD(origin, dest, plan);
      const svgLen = routeLength(origin, dest, plan);

      // Display ETA
      const metres  = Math.round(svgLen * 0.35);
      const minutes = Math.max(1, Math.round(metres / 50));
      if (demoEta)  demoEta.textContent  = `${minutes} min`;
      if (demoDist) demoDist.textContent = `${metres} m`;
      if (demoResult) { demoResult.style.display = 'flex'; }

      renderFloor(currentFloor, selectedDest);
      demoRoutePath = document.getElementById('demo-route-path');
      demoMovingDot = document.getElementById('demo-moving-dot');

      if (!demoRoutePath) return;

      demoRoutePath.setAttribute('d', pathD);
      const pLen = demoRoutePath.getTotalLength();
      demoRoutePath.style.strokeDasharray  = pLen;
      demoRoutePath.style.strokeDashoffset = pLen;

      // Animate route draw
      const drawDuration = 1200;
      const startDraw = performance.now();

      function drawStep(now) {
        const t = Math.min((now - startDraw) / drawDuration, 1);
        demoRoutePath.style.strokeDashoffset = pLen * (1 - t);
        if (t < 1) {
          demoAnimFrame = requestAnimationFrame(drawStep);
        } else {
          // Move marker along path
          moveMarker(pLen);
        }
      }

      if (demoAnimFrame) cancelAnimationFrame(demoAnimFrame);
      demoAnimFrame = requestAnimationFrame(drawStep);
    });
  }

  function moveMarker(pLen) {
    if (!demoMovingDot || !demoRoutePath) return;
    const moveDuration = 1800;
    const startMove = performance.now();

    function moveStep(now) {
      const t = Math.min((now - startMove) / moveDuration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const pt = demoRoutePath.getPointAtLength(eased * pLen);
      demoMovingDot.setAttribute('cx', pt.x);
      demoMovingDot.setAttribute('cy', pt.y);
      if (t < 1) {
        demoAnimFrame = requestAnimationFrame(moveStep);
      }
    }
    demoAnimFrame = requestAnimationFrame(moveStep);
  }

  // Initial render
  populateDestOptions(currentFloor);
  renderFloor(currentFloor, null);


  /* ----------------------------------------------------------
     7. CONTACT FORM – validation + success state
     ---------------------------------------------------------- */
  const form        = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formBody    = document.getElementById('contactFormBody');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      // Validate each required field
      form.querySelectorAll('[required]').forEach(field => {
        const errEl = document.getElementById('err-' + field.id.replace('cf-', ''));
        const empty = !field.value.trim();
        const badEmail = field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

        if (empty || badEmail) {
          field.classList.add('invalid');
          if (errEl) errEl.classList.add('show');
          valid = false;
        } else {
          field.classList.remove('invalid');
          if (errEl) errEl.classList.remove('show');
        }
      });

      if (!valid) return;

      // Submit via mailto (static site fallback)
      const name     = form.querySelector('#cf-name').value;
      const company  = form.querySelector('#cf-company').value;
      const email    = form.querySelector('#cf-email').value;
      const industry = form.querySelector('#cf-industry').value;
      const message  = form.querySelector('#cf-message').value;

      const body = `Name: ${name}%0ACompany: ${company}%0AEmail: ${email}%0AIndustry: ${industry}%0A%0AMessage:%0A${encodeURIComponent(message)}`;
      window.location.href = `mailto:info@inovaroute.co.ke?subject=Pilot Request – ${encodeURIComponent(company)}&body=${body}`;

      // Show success
      setTimeout(() => {
        if (formBody)    formBody.style.display = 'none';
        if (formSuccess) formSuccess.classList.add('show');
      }, 400);
    });

    // Clear invalid on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('invalid');
        const errEl = document.getElementById('err-' + field.id.replace('cf-', ''));
        if (errEl) errEl.classList.remove('show');
      });
    });
  }


  /* ----------------------------------------------------------
     8. ASSIST WIDGET
     ---------------------------------------------------------- */
  const assistPanel = document.getElementById('assist-panel');
  const assistOpen  = document.getElementById('assist-open');
  const assistClose = document.getElementById('assist-close');
  const assistNo    = document.getElementById('assist-no');

  if (assistOpen && assistPanel) {
    assistOpen.addEventListener('click', () => assistPanel.classList.toggle('open'));
  }
  [assistClose, assistNo].forEach(btn => {
    if (btn) btn.addEventListener('click', () => assistPanel.classList.remove('open'));
  });

  // Auto-open after 8s on first visit
  if (!sessionStorage.getItem('assistShown')) {
    setTimeout(() => {
      if (assistPanel) assistPanel.classList.add('open');
      sessionStorage.setItem('assistShown', '1');
    }, 8000);
  }


  /* ----------------------------------------------------------
     9. MULTI-PAGE ACTIVE NAV – mark the right link per page
     ---------------------------------------------------------- */
  (function() {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0].split('#')[0];
    allNavLinks.forEach(link => {
      const href     = link.getAttribute('href') || '';
      const linkPage = href.split('/').pop().split('?')[0].split('#')[0];
      if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
        link.classList.add('active');
      }
    });
  })();


  /* ----------------------------------------------------------
     10. ANALYTICS STUB – window.analytics.track()
     ---------------------------------------------------------- */
  window.analytics = window.analytics || {
    _queue: [],
    track(event, props) {
      this._queue.push({ event, props, ts: Date.now() });
      if (typeof console !== 'undefined') console.debug('[InovaRoute Analytics]', event, props);
    }
  };

  // Hero CTA tracking
  document.querySelectorAll('.hero .btn, .page-hero-section .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.analytics.track('hero_cta_clicked', { label: btn.textContent.trim(), page: window.location.pathname });
    });
  });

  // Demo launch clicks
  document.querySelectorAll('[href*="industries.html"]').forEach(link => {
    link.addEventListener('click', () => {
      window.analytics.track('demo_launch_clicked', { from: window.location.pathname });
    });
  });

  // Contact / pilot CTA clicks
  document.querySelectorAll('[href*="contact.html"]').forEach(link => {
    link.addEventListener('click', () => {
      window.analytics.track('contact_cta_clicked', { label: link.textContent.trim(), from: window.location.pathname });
    });
  });

  // Scroll depth milestones
  const scrollMilestones = [25, 50, 75, 90];
  const firedMilestones  = new Set();
  window.addEventListener('scroll', () => {
    const docH  = document.body.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    const pct = Math.round((window.scrollY / docH) * 100);
    scrollMilestones.forEach(m => {
      if (pct >= m && !firedMilestones.has(m)) {
        firedMilestones.add(m);
        window.analytics.track('scroll_depth', { percent: m, page: window.location.pathname });
      }
    });
  }, { passive: true });


  /* ----------------------------------------------------------
     11. INDUSTRY PAGE – tab switching + industry-aware demo
     ---------------------------------------------------------- */
  const INDUSTRY_DEMOS = {
    hospital: {
      label: 'Ground Floor · Hospital',
      title: 'Navigate to any ward or department',
      origin: { id: 'entrance', label: 'Main Entrance' },
      rooms: [
        { id: 'entrance',  label: 'Main Entrance', x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'reception', label: 'Reception',     x: 185, y: 168, w: 105, h: 70 },
        { id: 'pharmacy',  label: 'Pharmacy',      x: 20,  y: 168, w: 100, h: 70 },
        { id: 'emergency', label: 'Emergency',     x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'cafeteria', label: 'Cafeteria',     x: 185, y: 40,  w: 105, h: 80 },
        { id: 'radiology', label: 'Radiology',     x: 340, y: 40,  w: 110, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
    mall: {
      label: 'Level 1 · Shopping Mall',
      title: 'Find any shop or service instantly',
      origin: { id: 'entrance', label: 'Main Entrance' },
      rooms: [
        { id: 'entrance',  label: 'Entrance',     x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'foodcourt', label: 'Food Court',   x: 20,  y: 168, w: 100, h: 70 },
        { id: 'fashion',   label: 'Fashion Zone', x: 185, y: 168, w: 105, h: 70 },
        { id: 'cinema',    label: 'Cinema',       x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'info',      label: 'Info Desk',    x: 185, y: 40,  w: 105, h: 80 },
        { id: 'parking',   label: 'Car Park',     x: 340, y: 40,  w: 110, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
    airport: {
      label: 'Terminal 1 · Airport',
      title: 'Navigate gates, lounges & services',
      origin: { id: 'arrivals', label: 'Arrivals Hall' },
      rooms: [
        { id: 'arrivals', label: 'Arrivals',    x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'gate-a',   label: 'Gate A1',     x: 20,  y: 168, w: 100, h: 70 },
        { id: 'gate-b',   label: 'Gate B2',     x: 185, y: 168, w: 105, h: 70 },
        { id: 'dutyfree', label: 'Duty Free',   x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'checkin',  label: 'Check-in',    x: 185, y: 40,  w: 105, h: 80 },
        { id: 'lounge',   label: 'VIP Lounge',  x: 340, y: 40,  w: 110, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
    university: {
      label: 'Main Building · University',
      title: 'Guide students to any room or facility',
      origin: { id: 'gate', label: 'Main Gate' },
      rooms: [
        { id: 'gate',    label: 'Main Gate',    x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'library', label: 'Library',      x: 20,  y: 168, w: 100, h: 70 },
        { id: 'lab',     label: 'Computer Lab', x: 185, y: 168, w: 105, h: 70 },
        { id: 'lecture', label: 'Lecture Hall', x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'admin',   label: 'Admin Office', x: 185, y: 40,  w: 105, h: 80 },
        { id: 'canteen', label: 'Canteen',      x: 340, y: 40,  w: 110, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
    office: {
      label: 'Ground Floor · Office Complex',
      title: 'Navigate offices, meeting rooms & services',
      origin: { id: 'reception', label: 'Reception' },
      rooms: [
        { id: 'reception', label: 'Reception',    x: 355, y: 168, w: 105, h: 70, isOrigin: true },
        { id: 'meeting-a', label: 'Meeting Rm A', x: 20,  y: 168, w: 100, h: 70 },
        { id: 'it-dept',   label: 'IT Dept',      x: 185, y: 168, w: 105, h: 70 },
        { id: 'hr',        label: 'HR Office',    x: 20,  y: 40,  w: 100, h: 80 },
        { id: 'cafeteria', label: 'Cafeteria',    x: 185, y: 40,  w: 105, h: 80 },
        { id: 'exec',      label: 'Executive',    x: 340, y: 40,  w: 110, h: 80 },
      ],
      corridorY: 143, corridorH: 20,
    },
  };

  const indTabs   = document.querySelectorAll('.ind-tab');
  const indPanels = document.querySelectorAll('.ind-panel');
  let   currentIndustry = 'hospital';

  function switchIndustry(industry) {
    currentIndustry = industry;
    indTabs.forEach(t => t.classList.toggle('active', t.dataset.industry === industry));
    indPanels.forEach(p => p.classList.toggle('active', p.id === 'ind-panel-' + industry));
    loadIndDemo(industry);
    window.analytics && window.analytics.track('industry_tab_switched', { industry });
  }

  indTabs.forEach(tab => {
    tab.addEventListener('click', () => switchIndustry(tab.dataset.industry));
  });

  // Industry demo elements (industries.html)
  const indDemoSvg   = document.getElementById('ind-demo-svg');
  const indDestSel   = document.getElementById('indDemoDest');
  const indFindBtn   = document.getElementById('indDemoFindBtn');
  const indResult    = document.getElementById('indDemoResult');
  const indEta       = document.getElementById('indDemoEta');
  const indDist      = document.getElementById('indDemoDist');
  const indOriginLbl = document.getElementById('indDemoOriginLabel');
  const indTitle     = document.getElementById('indDemoTitle');

  let indSelectedDest = null;
  let indAnimFrame    = null;
  let indRoutePath    = null;
  let indMovingDot    = null;

  function renderIndFloor(plan, destId) {
    if (!indDemoSvg) return;

    let html = `
      <text x="240" y="26" fill="rgba(0,212,255,0.6)" font-size="9"
        font-family="Poppins,sans-serif" font-weight="700" letter-spacing="1.8"
        text-anchor="middle">${plan.label.toUpperCase()}</text>
      <rect x="14" y="${plan.corridorY}" width="452" height="${plan.corridorH}" rx="3"
        fill="rgba(0,212,255,0.07)" stroke="rgba(0,212,255,0.2)" stroke-width="1"/>
      <text x="240" y="${plan.corridorY + plan.corridorH / 2 + 3.5}"
        fill="rgba(0,212,255,0.4)" font-size="6.5" font-family="Poppins,sans-serif"
        text-anchor="middle" letter-spacing="2.5" font-weight="600">CORRIDOR</text>
    `;

    plan.rooms.forEach(room => {
      const cx = room.x + room.w / 2;
      const cy = room.y + room.h / 2;
      const isOrigin = room.isOrigin;
      const isDest   = room.id === destId;

      let fill, stroke, textCol, sw;
      if (isOrigin) {
        fill = 'rgba(0,212,255,0.2)'; stroke = 'rgba(0,212,255,0.75)';
        textCol = '#00d4ff'; sw = 2;
      } else if (isDest) {
        fill = 'rgba(15,184,160,0.2)'; stroke = 'rgba(15,184,160,0.75)';
        textCol = '#0fb8a0'; sw = 2;
      } else {
        fill = 'rgba(255,255,255,0.07)'; stroke = 'rgba(120,170,220,0.45)';
        textCol = 'rgba(255,255,255,0.72)'; sw = 1;
      }

      html += `
        <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="6"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${cx}" y="${cy - (isOrigin || isDest ? 8 : 0)}"
          fill="${textCol}" font-size="10" font-family="Poppins,sans-serif"
          text-anchor="middle" dominant-baseline="middle"
          font-weight="${isOrigin || isDest ? '700' : '500'}">${room.label}</text>
      `;
      if (isOrigin) html += `<text x="${cx}" y="${cy + 10}" fill="rgba(0,212,255,0.65)" font-size="7.5" font-family="Poppins,sans-serif" text-anchor="middle" font-weight="600">You are here</text>`;
      if (isDest)   html += `<text x="${cx}" y="${cy + 10}" fill="rgba(15,184,160,0.7)" font-size="7.5" font-family="Poppins,sans-serif" text-anchor="middle" font-weight="600">Destination</text>`;
    });

    const origin = plan.rooms.find(r => r.isOrigin);
    const oc = getCenter(origin);
    html += `
      <circle cx="${oc.x}" cy="${oc.y}" r="14" fill="rgba(0,212,255,0.08)" class="pulse-outer"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="8"  fill="rgba(0,212,255,0.2)"  class="pulse-inner"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="5"  fill="#00d4ff" filter="url(#indGlow)"/>
      <circle cx="${oc.x}" cy="${oc.y}" r="2.5" fill="white"/>
    `;

    if (destId) {
      const dest = plan.rooms.find(r => r.id === destId);
      if (dest) {
        const dc = getCenter(dest);
        html += `<circle cx="${dc.x}" cy="${dc.y}" r="6" fill="#0fb8a0" filter="url(#indGlow)"/><circle cx="${dc.x}" cy="${dc.y}" r="3" fill="white"/>`;
      }
    }

    html += `<path id="ind-route-path" fill="none" stroke="url(#indRouteGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d=""/>`;
    html += `<circle id="ind-moving-dot" cx="-20" cy="-20" r="5.5" fill="white" filter="url(#indGlow)"/>`;

    const defs = indDemoSvg.querySelector('defs');
    indDemoSvg.innerHTML = (defs ? defs.outerHTML : '') + html;
    indRoutePath = document.getElementById('ind-route-path');
    indMovingDot = document.getElementById('ind-moving-dot');
  }

  function loadIndDemo(industry) {
    const plan = INDUSTRY_DEMOS[industry];
    if (!plan || !indDemoSvg) return;

    if (indTitle)     indTitle.textContent     = plan.title;
    if (indOriginLbl) indOriginLbl.textContent = plan.origin.label;

    if (indDestSel) {
      indDestSel.innerHTML = '<option value="">Select destination…</option>';
      plan.rooms.filter(r => !r.isOrigin).forEach(room => {
        const opt = document.createElement('option');
        opt.value       = room.id;
        opt.textContent = room.label;
        indDestSel.appendChild(opt);
      });
    }

    indSelectedDest = null;
    if (indFindBtn) indFindBtn.disabled = true;
    if (indResult)  indResult.style.display = 'none';
    if (indAnimFrame) cancelAnimationFrame(indAnimFrame);
    renderIndFloor(plan, null);
  }

  if (indDestSel) {
    indDestSel.addEventListener('change', () => {
      indSelectedDest = indDestSel.value || null;
      if (indFindBtn) indFindBtn.disabled = !indSelectedDest;
      if (indResult)  indResult.style.display = 'none';
      if (indAnimFrame) cancelAnimationFrame(indAnimFrame);
      const plan = INDUSTRY_DEMOS[currentIndustry];
      if (plan) renderIndFloor(plan, indSelectedDest);
    });
  }

  if (indFindBtn) {
    indFindBtn.addEventListener('click', () => {
      if (!indSelectedDest) return;
      const plan   = INDUSTRY_DEMOS[currentIndustry];
      const origin = plan.rooms.find(r => r.isOrigin);
      const dest   = plan.rooms.find(r => r.id === indSelectedDest);
      if (!origin || !dest) return;

      const pathD  = buildRouteD(origin, dest, plan);
      const svgLen = routeLength(origin, dest, plan);
      const metres  = Math.round(svgLen * 0.35);
      const minutes = Math.max(1, Math.round(metres / 50));

      if (indEta)  indEta.textContent  = minutes + ' min';
      if (indDist) indDist.textContent = metres  + ' m';
      if (indResult) indResult.style.display = 'flex';

      renderIndFloor(plan, indSelectedDest);
      indRoutePath = document.getElementById('ind-route-path');
      indMovingDot = document.getElementById('ind-moving-dot');
      if (!indRoutePath) return;

      indRoutePath.setAttribute('d', pathD);
      const pLen = indRoutePath.getTotalLength();
      indRoutePath.style.strokeDasharray  = pLen;
      indRoutePath.style.strokeDashoffset = pLen;

      const drawDuration = 1200;
      const startDraw    = performance.now();

      function indDrawStep(now) {
        const t = Math.min((now - startDraw) / drawDuration, 1);
        indRoutePath.style.strokeDashoffset = pLen * (1 - t);
        if (t < 1) {
          indAnimFrame = requestAnimationFrame(indDrawStep);
        } else {
          indMoveMarker(pLen);
        }
      }

      if (indAnimFrame) cancelAnimationFrame(indAnimFrame);
      indAnimFrame = requestAnimationFrame(indDrawStep);

      window.analytics && window.analytics.track('demo_route_found', {
        industry: currentIndustry,
        destination: indSelectedDest,
        eta: minutes,
        distance: metres,
      });
    });
  }

  function indMoveMarker(pLen) {
    if (!indMovingDot || !indRoutePath) return;
    const moveDuration = 1800;
    const startMove    = performance.now();

    function indMoveStep(now) {
      const t     = Math.min((now - startMove) / moveDuration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const pt    = indRoutePath.getPointAtLength(eased * pLen);
      indMovingDot.setAttribute('cx', pt.x);
      indMovingDot.setAttribute('cy', pt.y);
      if (t < 1) indAnimFrame = requestAnimationFrame(indMoveStep);
    }
    indAnimFrame = requestAnimationFrame(indMoveStep);
  }

  // Init industry page: activate tab from URL param or default to hospital
  if (indTabs.length) {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam  = urlParams.get('tab');
    const initInd   = (tabParam && INDUSTRY_DEMOS[tabParam]) ? tabParam : 'hospital';
    switchIndustry(initInd);
  }

});
