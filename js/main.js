/* ============================================================
   EcomXprt — js/main.js  (Phase 1 — Production Ready)
   All shared interactivity. Requires js/data.js loaded first.
   ============================================================ */

/* ══════ SECURITY UTILITIES ══════ */
/**
 * Escape HTML special chars to prevent XSS.
 * Always use for any user-supplied content before injecting into DOM.
 */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Allow only safe inline formatting in bot responses:
 * newlines → <br>, URLs → safe anchor, no raw HTML.
 */
function renderBotText(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') /* safe: runs on already-escaped text */
    .replace(/\n/g, '<br>');
}

/**
 * Rate-limiter for chat input — prevents spam submissions.
 */
const _rl = { count: 0, ts: 0 };
function chatRateOk() {
  const now = Date.now();
  if (now - _rl.ts > 10000) { _rl.count = 0; _rl.ts = now; }
  _rl.count++;
  return _rl.count <= 8;
}

/* ══════ TOUCH DETECTION ══════ */
const isTouchDevice = () => window.matchMedia('(hover:none),(pointer:coarse)').matches;

/* ══════ SCROLL LOCK — single source of truth ══════
   Used by: mobile nav, case-study modal, legal modal, exit modal.
   Reference-counted so nested lock/unlock calls (e.g. nav open while a
   modal is open) never unlock too early. Preserves the exact scroll
   position on lock and restores it precisely on unlock — this is what
   stops the page from jumping to the top when a popup/menu closes. */
let _scrollLockCount = 0;
let _savedScrollY = 0;
function lockScroll() {
  if (_scrollLockCount === 0) {
    _savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = (-_savedScrollY) + 'px';
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');
  }
  _scrollLockCount++;
}
function unlockScroll() {
  if (_scrollLockCount === 0) return;
  _scrollLockCount--;
  if (_scrollLockCount === 0) {
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, _savedScrollY);
  }
}

/* ══════ SCROLL: progress bar + nav shrink ══════ */
/* Throttled scroll handler — runs once per animation frame at most */
let _scrollRAF = null;
window.addEventListener('scroll', () => {
  if (_scrollRAF) return;
  _scrollRAF = requestAnimationFrame(() => {
    _scrollRAF = null;
    const sp = document.getElementById('sp');
    const scroll = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    if (sp) sp.style.width = (total > 0 ? (scroll / total * 100).toFixed(2) + '%' : '0%');
    document.getElementById('mainNav')?.classList.toggle('scrolled', scroll > 50);
  });
}, { passive: true });

/* ══════ CUSTOM CURSOR (desktop only) ══════ */
(function () {
  if (isTouchDevice()) return;
  const c = document.getElementById('cur'), d = document.getElementById('cdot');
  if (!c || !d) return;
  let cx = 0, cy = 0, tx = 0, ty = 0, rafId;
  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    d.style.left = tx + 'px'; d.style.top = ty + 'px';
  }, { passive: true });
  function animate() {
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    c.style.left = cx + 'px'; c.style.top = cy + 'px';
    rafId = requestAnimationFrame(animate);
  }
  animate();
  function bindHover(el) {
    el.addEventListener('mouseenter', () => {
      c.style.transform = 'translate(-50%,-50%) scale(2)';
      c.style.borderColor = 'rgba(14,165,233,.5)';
    });
    el.addEventListener('mouseleave', () => {
      c.style.transform = 'translate(-50%,-50%) scale(1)';
      c.style.borderColor = 'var(--blue)';
    });
  }
  document.querySelectorAll('a,button,.svc-flip,.tm-flip,.port-card,.rcard,.pc,.prob-card,.proc-step,.faq-q,.mega-link,.map-btn,.ft-soc,input,textarea').forEach(bindHover);
})();

/* ══════ PARTNER LOGO MARQUEE (homepage) ══════ */
const mq = document.getElementById('mqTrack');
if (mq && typeof partners !== 'undefined') {
  /* Use DocumentFragment: single DOM insertion reduces reflows */
  const frag = document.createDocumentFragment();
  [...partners, ...partners].forEach(p => {
    const d = document.createElement('div');
    d.className = 'mq-item';
    const img = document.createElement('img');
    img.src = p.l;
    img.alt = escHtml(p.n) + ' — EcomXprt brand partner';
    img.loading = 'lazy';
    img.width = 120;
    img.height = 40;
    img.onerror = function() {
      const span = document.createElement('span');
      span.className = 'mq-name';
      span.textContent = p.n;
      this.replaceWith(span);
    };
    d.appendChild(img);
    frag.appendChild(d);
  });
  mq.appendChild(frag);
}

/* ══════ SERVICES GRID — respects data-limit ══════ */
const sg = document.getElementById('svcGrid');
if (sg && typeof svcs !== 'undefined') {
  const limit = sg.dataset.limit ? parseInt(sg.dataset.limit, 10) : null;
  const items = limit ? svcs.slice(0, limit) : svcs;
  items.forEach(s => {
    const d = document.createElement('div');
    d.className = 'svc-flip';
    d.id = 'svc-' + s.slug;
    d.setAttribute('role', 'article');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', s.t);
    d.innerHTML = `<div class="svc-fi"><div class="svc-face"><div class="svc-n">${s.n}</div><div class="svc-ico">${s.ic}</div><div class="svc-title">${s.t}</div><p class="svc-brief">${s.b}</p><div class="svc-pill">${s.pill}</div></div><div class="svc-back"><div class="sb-title">${s.t}</div><p class="sb-desc">${s.bk}</p><div class="sb-pts">${s.pts.map(p => `<div class="sb-pt">${p}</div>`).join('')}</div><a href="contact.html" class="sb-cta">Get Started →</a></div></div>`;
    sg.appendChild(d);
  });
  /* Scroll + pulse to hash-linked card */
  if (location.hash) {
    setTimeout(() => {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('svc-pulse');
        setTimeout(() => el.classList.remove('svc-pulse'), 2300);
      }
    }, 250);
  }
}

/* ══════ PORTFOLIO GRID ══════ */
function renderPort(f, limit) {
  const g = document.getElementById('portGrid');
  if (!g) return;
  g.innerHTML = '';
  let items = (!f || f === 'All') ? portData : portData.filter(p => p.cat === f);
  if (limit) items = items.slice(0, limit);
  if (!items.length) {
    g.innerHTML = '<div class="port-empty">No case studies in this category yet.</div>';
    return;
  }
  items.forEach(item => {
    const c = document.createElement('div');
    c.className = 'port-card';
    c.setAttribute('role', 'button');
    c.setAttribute('tabindex', '0');
    c.setAttribute('aria-label', `View case study: ${item.label}`);
    c.innerHTML = `<img src="${item.img}" alt="${item.label}" loading="lazy" onerror="this.style.display='none'"/><div class="port-fb">📊</div><div class="port-ov"><div><div class="port-tag">${item.cat}</div><div class="port-lbl">${item.label}</div><div class="port-met">${item.metric}</div></div></div>`;
    c.onclick = () => openCase(item);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(item); } });
    g.appendChild(c);
  });
}
const portGridEl = document.getElementById('portGrid');
if (portGridEl) renderPort('All', portGridEl.dataset.limit ? parseInt(portGridEl.dataset.limit, 10) : null);
function filterPort(btn, cat) {
  document.querySelectorAll('.pf-btn').forEach(b => {
    b.classList.remove('act');
    b.setAttribute('aria-pressed','false');
  });
  btn.classList.add('act');
  btn.setAttribute('aria-pressed','true');
  renderPort(cat);
}

/* ══════ TEAM GRID (about.html) ══════ */
const tg = document.getElementById('teamGrid');
if (tg && typeof team !== 'undefined') {
  team.forEach(m => {
    const d = document.createElement('div');
    d.className = 'tm-flip';
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', `${m.n} — ${m.r}`);
    d.innerHTML = `<div class="tm-fi"><div class="tm-face"><div class="tm-photo"><img src="${m.img}" alt="${m.n}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="tm-av" style="display:none">${m.i}</div></div><div class="tm-info"><div class="tm-name">${m.n}</div><div class="tm-role">${m.r}</div></div></div><div class="tm-back"><div class="tmb-name">${m.n}</div><div class="tmb-role">${m.r}</div><p class="tmb-bio">${m.bio}</p><div class="tmb-socs"><a href="https://www.linkedin.com/company/ecomxprt" target="_blank" rel="noopener noreferrer" class="tmb-soc">in</a><a href="https://x.com/ecomxprt" target="_blank" rel="noopener noreferrer" class="tmb-soc">𝕏</a></div></div></div>`;
    tg.appendChild(d);
  });
}

/* ══════ REVIEWS (homepage) ══════ */
const rg = document.getElementById('revGrid');
if (rg && typeof revs !== 'undefined') {
  const rfrag = document.createDocumentFragment();
  revs.forEach(r => {
    const d = document.createElement('div');
    d.className = 'rcard rv';
    const initials = r.n.split(' ').map(w => w[0]).join('').slice(0, 2);
    /* Build review card safely with DOM API — no innerHTML for user-like content */
    const quote = document.createElement('div');
    quote.className = 'rq'; quote.setAttribute('aria-hidden','true'); quote.textContent = '"';
    const stars = document.createElement('div');
    stars.className = 'r-stars';
    stars.setAttribute('aria-label', `${r.s} out of 5 stars`);
    stars.textContent = '★'.repeat(Math.min(r.s, 5));
    const txt = document.createElement('p');
    txt.className = 'r-text'; txt.textContent = '" ' + r.t + ' "';
    const auth = document.createElement('div');
    auth.className = 'r-author';
    /* Avatar */
    if (r.ph) {
      const img = document.createElement('img');
      img.className = 'r-av'; img.src = r.ph;
      img.alt = r.n + ' — EcomXprt client review';
      img.loading = 'lazy'; img.width = 40; img.height = 40;
      img.onerror = function() {
        const fb = document.createElement('div'); fb.className = 'r-av-fb';
        fb.textContent = initials; fb.setAttribute('aria-hidden','true');
        this.replaceWith(fb);
      };
      auth.appendChild(img);
    } else {
      const fb = document.createElement('div');
      fb.className = 'r-av-fb'; fb.textContent = initials;
      fb.setAttribute('aria-hidden', 'true'); auth.appendChild(fb);
    }
    const info = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'r-name'; nm.textContent = r.n;
    const co = document.createElement('div'); co.className = 'r-co'; co.textContent = r.r;
    info.appendChild(nm); info.appendChild(co); auth.appendChild(info);
    d.appendChild(quote); d.appendChild(stars); d.appendChild(txt); d.appendChild(auth);
    rfrag.appendChild(d);
  });
  rg.appendChild(rfrag);
}

/* ══════ PRICING (pricing.html) ══════ */
const pgEl = document.getElementById('pricingGrid');
if (pgEl && typeof tiers !== 'undefined') {
  const pfrag = document.createDocumentFragment();
  tiers.forEach((t, idx) => {
    const d = document.createElement('div');
    d.className = 'pc' + (t.feat ? ' feat' : '');
    d.setAttribute('aria-label', t.name + ' pricing tier');
    if (t.feat) d.setAttribute('aria-describedby', 'pc-popular-label');
    const tier = document.createElement('div'); tier.className = 'pc-tier'; tier.textContent = t.tier;
    const name = document.createElement('div'); name.className = 'pc-name'; name.textContent = t.name;
    if (t.feat) { const badge = document.createElement('span'); badge.id = 'pc-popular-label'; badge.className = 'pc-popular'; badge.textContent = 'Most Popular'; name.appendChild(badge); }
    const desc = document.createElement('div'); desc.className = 'pc-desc'; desc.textContent = t.desc;
    const ul = document.createElement('ul'); ul.className = 'pc-feats'; ul.setAttribute('aria-label', t.name + ' features');
    t.feats.forEach(f => { const li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });
    const cta = document.createElement('a'); cta.href = 'contact.html'; cta.className = 'pc-cta';
    cta.textContent = 'Get Custom Quote →';
    cta.setAttribute('aria-label', 'Get a custom quote for ' + t.name + ' tier');
    d.appendChild(tier); d.appendChild(name); d.appendChild(desc); d.appendChild(ul); d.appendChild(cta);
    pfrag.appendChild(d);
  });
  pgEl.appendChild(pfrag);
}

/* ══════ SCROLL REVEAL ══════ */
const rvObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el => rvObserver.observe(el));

/* ══════ ANIMATED COUNTERS ══════ */
function animCtr(sel) {
  document.querySelectorAll(sel).forEach(el => {
    const target = parseInt(el.dataset.t, 10);
    let v = 0;
    const step = target / 72;
    const tick = () => {
      v = Math.min(v + step, target);
      el.textContent = Math.round(v).toLocaleString();
      if (v < target) requestAnimationFrame(tick);
    };
    tick();
  });
}
const ioA = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    animCtr('.ctrA');
    ioA.disconnect();
    setTimeout(() => {
      document.querySelectorAll('.skill-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
    }, 200);
  }
}, { threshold: 0.25 });
const ioS = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { animCtr('.ctrS'); ioS.disconnect(); }
}, { threshold: 0.3 });
const aboutEl = document.getElementById('about');
const statsBandEl = document.getElementById('statsBand');
if (aboutEl) ioA.observe(aboutEl);
if (statsBandEl) ioS.observe(statsBandEl);

/* ══════ MOBILE NAV — fully improved ══════ */
let mobNavOpen = false;
let mobOverlay = null;

function createOverlay() {
  if (mobOverlay) return;
  mobOverlay = document.createElement('div');
  mobOverlay.className = 'mob-overlay';
  mobOverlay.setAttribute('aria-hidden', 'true');
  mobOverlay.addEventListener('click', closeMob);
  document.body.appendChild(mobOverlay);
}

function openMob() {
  if (mobNavOpen) return;
  createOverlay();
  mobNavOpen = true;
  const nav = document.getElementById('mobNav');
  if (!nav) return;
  nav.classList.add('open');
  nav.setAttribute('aria-hidden', 'false');
  lockScroll();
  requestAnimationFrame(() => { if (mobOverlay) mobOverlay.classList.add('active'); });
  const ham = document.querySelector('.ham');
  if (ham) ham.setAttribute('aria-expanded', 'true');
}

function closeMob() {
  if (!mobNavOpen) return;
  mobNavOpen = false;
  const nav = document.getElementById('mobNav');
  if (nav) { nav.classList.remove('open'); nav.setAttribute('aria-hidden', 'true'); }
  unlockScroll();
  if (mobOverlay) mobOverlay.classList.remove('active');
  const ham = document.querySelector('.ham');
  if (ham) ham.setAttribute('aria-expanded', 'false');
  /* Always collapse any open accordion so the menu reopens fresh next time */
  document.querySelectorAll('.mob-sub-toggle.open').forEach(closeMobSub);
}

/* Hamburger icon: single source of truth for open vs close */
function toggleMob() {
  if (mobNavOpen) closeMob(); else openMob();
}

/* Tap on the empty background of the mobile nav panel (not a link/button)
   closes the menu — links, buttons and the Services accordion handle
   their own clicks and are unaffected. */
(function () {
  const nav = document.getElementById('mobNav');
  if (!nav) return;
  nav.addEventListener('click', e => {
    if (e.target === nav) closeMob();
  });
})();

/* Close mobile nav on resize to desktop */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 768 && mobNavOpen) closeMob();
    const openSubBtn = document.querySelector('.mob-sub-toggle.open');
    if (openSubBtn && window.innerWidth <= 768) openMobSub(openSubBtn);
    if (window.innerWidth > 768 && chatOpen) {
      if (chatScrollLocked) { unlockScroll(); chatScrollLocked = false; }
      const panel = document.getElementById('chatPanel');
      if (panel) { panel.style.bottom = ''; panel.style.maxHeight = ''; }
    }
  }, 150);
}, { passive: true });

/* ══════ SERVICES ACCORDION (mobile nav) — single source of truth ══════
   Tap toggles open/closed every time. Opening one dropdown closes any
   other open dropdown (future-proofed for more than one accordion). */
function closeMobSub(btn) {
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  const sub = btn.nextElementSibling;
  if (sub) { sub.classList.remove('open'); sub.style.maxHeight = ''; }
}

/* Sizes the open accordion to its real content height, capped to whatever
   vertical space is actually left in the viewport below it (minus a small
   safety margin). Content taller than that scrolls inside .mob-sub via the
   overflow-y:auto set on .mob-sub.open in CSS — nothing is ever cut off. */
function openMobSub(btn) {
  const sub = btn.nextElementSibling;
  if (!sub) return;
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  sub.classList.add('open');
  const available = Math.max(120, window.innerHeight - sub.getBoundingClientRect().top - 24);
  sub.style.maxHeight = Math.min(sub.scrollHeight, available) + 'px';
}

document.querySelectorAll('.mob-sub-toggle').forEach(btn => {
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !btn.classList.contains('open');
    document.querySelectorAll('.mob-sub-toggle.open').forEach(other => {
      if (other !== btn) closeMobSub(other);
    });
    if (willOpen) openMobSub(btn); else closeMobSub(btn);
  });
});

/* ══════ TAP-TO-FLIP — service + team cards (touch devices) ══════ */
(function () {
  function initFlipCards() {
    if (!isTouchDevice()) return;

    function flipCard(card, group) {
      const isFlipped = card.classList.contains('flipped');
      /* close all cards in this group */
      document.querySelectorAll(group + '.flipped').forEach(c => c.classList.remove('flipped'));
      if (!isFlipped) card.classList.add('flipped');
    }

    /* Service cards */
    document.querySelectorAll('.svc-flip').forEach(card => {
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        flipCard(this, '.svc-flip');
      });
      /* Keyboard accessible flip */
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flipCard(this, '.svc-flip');
        }
      });
    });

    /* Team cards */
    document.querySelectorAll('.tm-flip').forEach(card => {
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        flipCard(this, '.tm-flip');
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flipCard(this, '.tm-flip');
        }
      });
    });

    /* Tap outside to close all */
    document.addEventListener('click', () => {
      document.querySelectorAll('.svc-flip.flipped, .tm-flip.flipped')
        .forEach(c => c.classList.remove('flipped'));
    });
  }

  /* Init after dynamic content is rendered */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlipCards);
  } else {
    initFlipCards();
  }

  /* Re-init if cards are added to DOM after initial render (team grid) */
  const tgEl = document.getElementById('teamGrid');
  if (tgEl) {
    new MutationObserver(() => { if (isTouchDevice()) initFlipCards(); })
      .observe(tgEl, { childList: true });
  }
})();

/* ══════ CONTACT FORM — with field clearing + better UX ══════ */
submitForm._pageLoadTs = Date.now();
function submitForm(btn) {
  const nameEl = document.getElementById('fName');
  const emailEl = document.getElementById('fEmail');
  /* Honeypot: real users leave this blank; bots fill it in */
  const trap = document.getElementById('fWebsite')?.value;
  /* Additional bot signals: unusually fast submission or non-human timing */
  const elapsed = Date.now() - (submitForm._pageLoadTs || Date.now());
  if (trap || elapsed < 3000) { return; } /* silently drop */

  const name = nameEl?.value.trim();
  const email = emailEl?.value.trim();
  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailValid) {
    const msg = !name ? '⚠ Please enter your name' : '⚠ Please enter a valid email';
    btn.textContent = msg;
    btn.style.background = 'linear-gradient(135deg,#6B21A8,#9333EA)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Send Message & Request Free Audit →';
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
    return;
  }

  btn.textContent = 'Sending…';
  btn.disabled = true;

  /* Simulate async send — replace with real fetch() call */
  setTimeout(() => {
    btn.textContent = '✓ Message sent! We will reply within 24 hours.';
    btn.style.background = 'linear-gradient(135deg,#065F46,#10B981)';
    /* Clear all fields on success */
    ['fName', 'fEmail', 'fCompany', 'fMarket', 'fService', 'fGoals'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    setTimeout(() => {
      btn.textContent = 'Send Message & Request Free Audit →';
      btn.style.background = '';
      btn.disabled = false;
    }, 5000);
  }, 400);
}

/* ══════ AI ASSISTANT — modular knowledge-driven engine ══════
   Loaded from js/chatbot/*.js (nlp → knowledge-base → intent-engine
   → conversation-memory → response-composer → bot). Knowledge itself
   lives in knowledge/*.json, fetched same-origin — no external API
   calls, nothing leaves the browser. See js/chatbot/bot.js. ══════ */

let ecxBot = null;
let ecxBotLoading = null;

/** Returns a promise that resolves once the bot has loaded its
 *  knowledge files. Safe to call repeatedly — only loads once. */
function getBot() {
  if (ecxBot) return Promise.resolve(ecxBot);
  if (ecxBotLoading) return ecxBotLoading;
  if (typeof EcomXprtBot === 'undefined') {
    console.warn('EcomXprtBot not loaded yet.');
    return Promise.resolve(null);
  }
  const instance = new EcomXprtBot('knowledge/');
  ecxBotLoading = instance.init().then(() => { ecxBot = instance; return ecxBot; })
    .catch(err => { console.error('EcomXprt AI assistant failed to load knowledge:', err); return null; });
  return ecxBotLoading;
}

/* ── Chat UI State ─────────────────────────────────────── */
let chatOpen = false, chatInited = false, chatScrollLocked = false;
const isMobileViewport = () => window.matchMedia('(max-width:768px)').matches;

/* Keep the chat panel above the on-screen keyboard and within the
   visible viewport on mobile, using the VisualViewport API (falls
   back to doing nothing on browsers that lack it — desktop layout
   is completely unaffected). */
function adjustChatForKeyboard() {
  const panel = document.getElementById('chatPanel');
  const vv = window.visualViewport;
  if (!panel || !chatOpen || !isMobileViewport() || !vv) return;
  const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  panel.style.bottom = (keyboardInset + 16) + 'px';
  panel.style.maxHeight = Math.round(vv.height - 24) + 'px';
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', adjustChatForKeyboard);
  window.visualViewport.addEventListener('scroll', adjustChatForKeyboard);
}

/* ── Render a message bubble ───────────────────────────── */
function addMsg(text, role) {
  const d = document.getElementById('chatMsgs');
  if (!d) return;
  const isBot = role === 'bot';
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  /* Build DOM nodes without innerHTML to prevent XSS */
  const row = document.createElement('div');
  row.style.cssText = `display:flex;gap:8px;margin-bottom:4px;${isBot ? '' : 'flex-direction:row-reverse'}`;
  row.setAttribute('role', isBot ? 'log' : 'none');
  /* Bot avatar */
  if (isBot) {
    const av = document.createElement('div');
    av.setAttribute('aria-hidden', 'true');
    av.style.cssText = 'width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#0284C7,#0EA5E9);display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:#fff;flex-shrink:0;margin-top:2px;font-family:Syne,sans-serif;letter-spacing:-.5px';
    av.textContent = 'ECX';
    row.appendChild(av);
  }
  /* Message column */
  const col = document.createElement('div');
  col.style.cssText = `max-width:82%;display:flex;flex-direction:column;gap:3px;${isBot ? '' : 'align-items:flex-end'}`;
  /* Bubble — bot text rendered as safe HTML, user text escaped */
  const bubble = document.createElement('div');
  bubble.style.cssText = `background:${isBot ? 'rgba(14,165,233,.07);border:1px solid rgba(14,165,233,.16);color:rgba(255,255,255,.88)' : 'linear-gradient(135deg,#0284C7,#0EA5E9);color:#fff'};border-radius:14px;${isBot ? 'border-top-left-radius:3px' : 'border-top-right-radius:3px'};padding:9px 13px;font-size:11.5px;line-height:1.7;font-family:DM Sans,sans-serif;word-break:break-word`;
  if (isBot) {
    bubble.innerHTML = renderBotText(text); /* safe: escapes then converts \n→<br> */
  } else {
    bubble.textContent = text; /* raw user input — textContent is XSS-safe */
  }
  /* Timestamp */
  const ts = document.createElement('span');
  ts.style.cssText = 'font-size:9px;color:rgba(255,255,255,.2);padding:0 2px';
  ts.setAttribute('aria-hidden', 'true');
  ts.textContent = t;
  col.appendChild(bubble);
  col.appendChild(ts);
  row.appendChild(col);
  d.appendChild(row);
  d.scrollTop = d.scrollHeight;
  /* Announce new bot message to screen readers */
  if (isBot) _announceToSR(text);
}

/** Polite live region for screen-reader chat announcements */
function _announceToSR(msg) {
  let lr = document.getElementById('chatLiveRegion');
  if (!lr) {
    lr = document.createElement('div');
    lr.id = 'chatLiveRegion';
    lr.setAttribute('aria-live', 'polite');
    lr.setAttribute('aria-atomic', 'true');
    lr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
    document.body.appendChild(lr);
  }
  lr.textContent = '';
  requestAnimationFrame(() => { lr.textContent = msg.slice(0, 200); });
}

/* ── Show typing indicator ─────────────────────────────── */
function showTyping() {
  const d = document.getElementById('chatMsgs');
  if (!d) return;
  const ty = document.createElement('div');
  ty.id = 'chatTy';
  ty.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:4px';
  ty.innerHTML = '<div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#0284C7,#0EA5E9);display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:#fff;font-family:Syne,sans-serif">ECX</div><div style="background:rgba(14,165,233,.07);border:1px solid rgba(14,165,233,.16);border-radius:14px;border-top-left-radius:3px;padding:10px 16px;display:flex;gap:5px;align-items:center"><span style="width:5px;height:5px;background:var(--blue);border-radius:50%;animation:blink .8s infinite;display:block"></span><span style="width:5px;height:5px;background:var(--blue);border-radius:50%;animation:blink .8s .25s infinite;display:block"></span><span style="width:5px;height:5px;background:var(--blue);border-radius:50%;animation:blink .8s .5s infinite;display:block"></span></div>';
  d.appendChild(ty);
  d.scrollTop = d.scrollHeight;
}

/* ── Render suggestion chips ───────────────────────────── */
function renderSuggestions(suggestions) {
  const qr = document.getElementById('quickReplies');
  if (!qr || !suggestions || !suggestions.length) return;
  qr.innerHTML = '';
  suggestions.slice(0, 5).forEach(q => {
    const b = document.createElement('button');
    b.textContent = q;
    b.className = 'qb';
    b.onclick = () => { qr.innerHTML = ''; sendChatMsg(q); };
    qr.appendChild(b);
  });
}

/* ── Init chat on first open ───────────────────────────── */
function initChat() {
  if (chatInited) return;
  chatInited = true;
  showTyping();
  getBot().then(bot => {
    const tyEl = document.getElementById('chatTy');
    if (tyEl) tyEl.remove();
    if (!bot) {
      addMsg("Hi! I'm having trouble loading my full knowledge base right now — you can still reach the team directly at admin@ecomxprt.com.", 'bot');
      renderSuggestions(['Contact team']);
      return;
    }
    const greeting = bot.greeting();
    addMsg(greeting.text, 'bot');
    renderSuggestions(greeting.suggestions);
  });
}

/* ── Toggle chat panel ─────────────────────────────────── */
function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  panel?.classList.toggle('open', chatOpen);
  if (chatOpen) {
    const n = document.getElementById('chatNotif');
    if (n) n.style.display = 'none';
    initChat();
    if (isMobileViewport()) {
      /* Prevent the page behind the chat sheet from scrolling on mobile */
      lockScroll();
      chatScrollLocked = true;
      adjustChatForKeyboard();
    } else {
      setTimeout(() => document.getElementById('chatInp')?.focus(), 380);
    }
  } else {
    if (chatScrollLocked) { unlockScroll(); chatScrollLocked = false; }
    if (panel) { panel.style.bottom = ''; panel.style.maxHeight = ''; }
  }
}

/* ── Send a message ────────────────────────────────────── */
function sendChatMsg(msg) {
  const m = String(msg ?? '').trim().slice(0, 400);
  if (!m) return;
  if (!chatRateOk()) { addMsg('Please wait a moment before sending more messages.', 'bot'); return; }
  addMsg(m, 'user');
  const qr = document.getElementById('quickReplies');
  if (qr) qr.innerHTML = '';
  showTyping();
  const minDelay = new Promise(res => setTimeout(res, 500 + Math.random() * 400));
  Promise.all([getBot(), minDelay]).then(([bot]) => {
    const tyEl = document.getElementById('chatTy');
    if (tyEl) tyEl.remove();
    const result = bot
      ? bot.respond(m)
      : { text: 'Please contact admin@ecomxprt.com for assistance.', suggestions: [] };
    addMsg(result.text, 'bot');
    renderSuggestions(result.suggestions);
  });
}

/* ── Enter key send ────────────────────────────────────── */
function sendChat() {
  const i = document.getElementById('chatInp');
  if (i && i.value.trim()) { sendChatMsg(i.value); i.value = ''; }
}

/* ══════ MEGA MENU / SERVICE DEEP-LINK ══════ */
function goToSvc(slug, evt) {
  if (document.getElementById('svcGrid')) {
    if (evt) evt.preventDefault();
    closeMob();
    const el = document.getElementById('svc-' + slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('svc-pulse');
      setTimeout(() => el.classList.remove('svc-pulse'), 2300);
    }
  } else {
    closeMob();
  }
}

/* ══════ FAQ ACCORDION ══════ */
function toggleFaq(btn) {
  const ans = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  document.querySelectorAll('.faq-q.open').forEach(b => {
    b.classList.remove('open');
    b.setAttribute('aria-expanded', 'false');
    if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
  });
  if (!isOpen) {
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    if (ans) ans.classList.add('open');
  }
}

/* ══════ STICKY CTA BAR ══════ */
(function () {
  const bar = document.getElementById('stickyCta');
  if (!bar || sessionStorage.getItem('ecx_sticky_dismissed')) return;
  const anchor = document.getElementById('home') || document.querySelector('.page-hero');
  window.addEventListener('scroll', () => {
    if (sessionStorage.getItem('ecx_sticky_dismissed')) return;
    const trigger = anchor ? anchor.offsetHeight * 0.85 : 400;
    bar.classList.toggle('show', window.scrollY > trigger);
  }, { passive: true });
})();

function dismissSticky() {
  document.getElementById('stickyCta')?.classList.remove('show');
  sessionStorage.setItem('ecx_sticky_dismissed', '1');
}

/* ══════ EXIT INTENT (desktop only, once per session) ══════ */
(function () {
  const modal = document.getElementById('exitModal');
  if (!modal) return;
  if (window.innerWidth < 900 || !window.matchMedia('(pointer:fine)').matches) return;
  if (sessionStorage.getItem('ecx_exit_shown')) return;
  let armed = false, shown = false;
  setTimeout(() => { armed = true; }, 5000);
  document.addEventListener('mouseout', e => {
    if (!armed || shown) return;
    if (e.clientY <= 4 && !e.relatedTarget) {
      shown = true;
      sessionStorage.setItem('ecx_exit_shown', '1');
      modal.classList.add('show');
    }
  });
})();

function closeExit() { document.getElementById('exitModal')?.classList.remove('show'); }

function submitExit(e) {
  e.preventDefault();
  if (document.getElementById('exitWebsite')?.value) return false;
  const email = String(document.getElementById('exitEmail')?.value ?? '').trim().slice(0, 254);
  if (!email) return false;
  const card = document.querySelector('#exitModal .exit-card');
  if (card) card.innerHTML = '<div class="exit-ic">✅</div><h3>You are on the list!</h3><p>We will email your free audit details shortly. Talk soon.</p><button class="btn-blue" style="width:100%;justify-content:center" onclick="closeExit()">Close</button>';
  setTimeout(closeExit, 2800);
  return false;
}

/* ══════ CASE STUDY MODAL ══════ */
function caseNarrative(item) {
  const n = {
    PPC: { tag: 'Paid Search', title: 'Smarter Campaign Structure, Lower Wasted Spend', body: `This ${item.label.toLowerCase()} engagement was bleeding budget on broad-match keywords with almost no negative targeting. We rebuilt the account around exact/phrase/auto separation, layered in weekly negative-keyword sculpting, and shifted spend toward proven converters.` },
    Sales: { tag: 'Growth & Conversion', title: 'Turning Steady Traffic Into Real Revenue', body: `The brand had decent traffic but flat conversion. We rewrote the listing for clarity and search intent, restructured pricing tiers, and tightened the handoff between paid traffic and organic rank so visitors actually converted.` },
    Photography: { tag: 'Creative & Content', title: 'Visuals Built to Convert, Not Just Look Good', body: `The existing product images weren't pulling their weight on mobile. Our in-house photography &amp; 3D team rebuilt the full visual set — lifestyle shots, infographics and renders — to meet Amazon's A+ content standards.` }
  };
  return n[item.cat] || { tag: item.cat, title: item.label, body: 'A focused engagement to fix the bottleneck holding this account back.' };
}

function openCase(item) {
  const nar = caseNarrative(item);
  const imgEl = document.getElementById('caseImg');
  if (imgEl) { imgEl.style.display = ''; imgEl.src = item.img; imgEl.alt = item.label; }
  document.getElementById('caseTag').textContent = nar.tag;
  document.getElementById('caseTitle').textContent = nar.title;
  document.getElementById('caseBody').innerHTML = nar.body;
  document.getElementById('caseMetric').textContent = item.metric;
  document.getElementById('caseModal').classList.add('show');
  lockScroll();
}

function closeCase() {
  document.getElementById('caseModal')?.classList.remove('show');
  unlockScroll();
}

/* ══════ LEGAL MODALS ══════ */
const legalCopy = {
  privacy: { title: 'Privacy Policy', body: `<p>We collect the information you submit through our contact form, free-audit requests, and newsletter signup — name, email, and company details — solely to respond to your inquiry and share relevant updates.</p><h4>What we don't do</h4><p>We do not sell or rent your information to third parties, and we never share account-level data without written consent.</p><h4>Your control</h4><p>You can unsubscribe from emails at any time via the link in any message, or by contacting <a href="mailto:admin@ecomxprt.com" style="color:var(--blue2)">admin@ecomxprt.com</a> directly.</p>` },
  terms: { title: 'Terms of Service', body: `<p>By using this website you agree to use it for lawful purposes only. Content, branding, and case-study materials on this site belong to EcomXprt and may not be reproduced without permission.</p><h4>Service engagements</h4><p>Actual service engagements are governed by a separate signed agreement provided after your consultation — nothing on this website constitutes a binding service contract.</p><h4>Updates</h4><p>We may update this site content at any time without prior notice.</p>` }
};

function openLegal(type) {
  const data = legalCopy[type];
  if (!data) return;
  document.getElementById('legalTitle').textContent = data.title;
  document.getElementById('legalBody').innerHTML = data.body;
  document.getElementById('legalModal').classList.add('show');
  lockScroll();
}
function closeLegal() {
  document.getElementById('legalModal')?.classList.remove('show');
  unlockScroll();
}

/* ══════ NEWSLETTER ══════ */
function submitNewsletter(e) {
  e.preventDefault();
  if (document.getElementById('nlWebsite')?.value) return false;
  const note = document.getElementById('nlNote');
  note.textContent = '✅ Subscribed — welcome aboard!';
  note.style.color = 'var(--green)';
  document.getElementById('nlEmail').value = '';
  setTimeout(() => { note.textContent = 'No spam. Unsubscribe anytime.'; note.style.color = ''; }, 4000);
  return false;
}

/* ══════ MODAL / OVERLAY CLOSE: backdrop click + Escape ══════ */
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) {
      ov.classList.remove('show');
      unlockScroll();
    }
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(ov => {
      ov.classList.remove('show'); unlockScroll();
    });
    closeMob();
    if (chatOpen) toggleChat();
    return;
  }
  /* Tab key: trap focus inside open modals */
  if (e.key === 'Tab') {
    const openModal = document.querySelector('.modal-overlay.show');
    if (!openModal) return;
    const focusable = openModal.querySelectorAll('button,a,[href],input,textarea,[tabindex]:not([tabindex="-1"])');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault(); (e.shiftKey ? last : first)?.focus();
    }
    return;
  }
});

/* ══════ OFFICE MAP (contact.html) ══════ */
(function () {
  const addr = 'Office #302 Royal Tower B Block, Main Boulevard, Citi Housing, Jhelum, Punjab, Pakistan';
  const q = encodeURIComponent(addr);
  const frame = document.getElementById('officeMapFrame');
  if (frame) frame.src = `https://maps.google.com/maps?q=${q}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const dir = document.getElementById('getDirectionsBtn');
  if (dir) dir.href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const openBtn = document.getElementById('openMapsBtn');
  if (openBtn) openBtn.href = `https://www.google.com/maps?q=${q}`;
})();

/* ══════ TEAM PHOTO BADGE FIX (for any version of CSS) ══════ */
(function () {
  function fixBadges() {
    document.querySelectorAll('.tm-photo').forEach(ph => {
      if (ph.dataset.bfx) return;
      ph.dataset.bfx = '1';
      const img = ph.querySelector('img');
      const av = ph.querySelector('.tm-av');
      if (!img || !av) return;
      img.addEventListener('error', () => { img.style.display = 'none'; av.classList.add('show'); });
      img.addEventListener('load', () => { img.style.display = ''; av.classList.remove('show'); });
      if (img.complete) {
        if (!img.naturalWidth && img.src) { img.style.display = 'none'; av.classList.add('show'); }
        else { img.style.display = ''; av.classList.remove('show'); }
      }
    });
  }
  const tgEl2 = document.getElementById('teamGrid');
  if (tgEl2) new MutationObserver(fixBadges).observe(tgEl2, { childList: true });
  setTimeout(fixBadges, 500);
  setTimeout(fixBadges, 1500);
})();
