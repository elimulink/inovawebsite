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
      <rect x="10" y="10" width="460" height="240" rx="10"
        fill="rgba(13,27,42,0.7)" stroke="rgba(0,212,255,0.13)" stroke-width="1"/>
      <text x="22" y="28" fill="rgba(0,212,255,0.45)" font-size="7.5"
        font-family="Poppins,sans-serif" font-weight="600" letter-spacing="1.2">
        ${plan.label.toUpperCase()}
      </text>
      <rect x="18" y="${plan.corridorY}" width="444" height="${plan.corridorH}" rx="3"
        fill="rgba(0,212,255,0.025)" stroke="rgba(0,212,255,0.07)" stroke-width="0.5"/>
      <text x="240" y="${plan.corridorY + plan.corridorH / 2 + 3}"
        fill="rgba(0,212,255,0.18)" font-size="5.5" font-family="Poppins,sans-serif"
        text-anchor="middle" letter-spacing="2">CORRIDOR</text>
    `;

    plan.rooms.forEach(room => {
      const cx = room.x + room.w / 2;
      const cy = room.y + room.h / 2;
      const isOrigin = room.isOrigin;
      const isDest   = room.id === destId;

      let fill, stroke, textCol, sw;
      if (isOrigin) {
        fill = 'rgba(0,212,255,0.09)'; stroke = 'rgba(0,212,255,0.45)';
        textCol = 'rgba(0,212,255,0.85)'; sw = 1.5;
      } else if (isDest) {
        fill = 'rgba(15,184,160,0.1)'; stroke = 'rgba(15,184,160,0.5)';
        textCol = 'rgba(15,184,160,0.9)'; sw = 1.5;
      } else {
        fill = 'rgba(0,212,255,0.03)'; stroke = 'rgba(0,212,255,0.18)';
        textCol = 'rgba(255,255,255,0.32)'; sw = 0.75;
      }

      html += `
        <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="5"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <text x="${cx}" y="${cy - (isOrigin || isDest ? 6 : 0)}"
          fill="${textCol}" font-size="7.5" font-family="Poppins,sans-serif"
          text-anchor="middle" dominant-baseline="middle"
          font-weight="${isOrigin || isDest ? '600' : '400'}">${room.label}</text>
      `;
      if (isOrigin) html += `<text x="${cx}" y="${cy + 9}" fill="rgba(0,212,255,0.45)" font-size="6" font-family="Poppins,sans-serif" text-anchor="middle">You are here</text>`;
      if (isDest)   html += `<text x="${cx}" y="${cy + 9}" fill="rgba(15,184,160,0.55)" font-size="6" font-family="Poppins,sans-serif" text-anchor="middle">Destination</text>`;
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

});
