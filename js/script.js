/* ============================================================
   NUREKA — script.js
   Vanilla JavaScript — No frameworks
   ============================================================ */

'use strict';

/* ============================================================
   1. THEME TOGGLE
   ============================================================ */

const ThemeManager = (() => {
  const STORAGE_KEY = 'nureka-theme';
  const DARK        = 'dark';
  const LIGHT       = 'light';

  const root      = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggleBtn) {
      toggleBtn.setAttribute(
        'aria-label',
        theme === DARK ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  }

  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function getCurrentTheme() {
    return root.getAttribute('data-theme') || DARK;
  }

  function toggle() {
    const next = getCurrentTheme() === DARK ? LIGHT : DARK;
    applyTheme(next);
    saveTheme(next);
  }

  function init() {
    const saved   = getSavedTheme();
    const initial = saved || DARK;
    applyTheme(initial);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }
  }

  return { init };
})();


/* ============================================================
   2. NAVBAR — Glassmorphism on scroll
   ============================================================ */

const NavbarScroll = (() => {
  const SCROLL_THRESHOLD = 20;
  const SCROLL_CLASS     = 'is-scrolled';
  const navbar           = document.getElementById('navbar');

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle(SCROLL_CLASS, window.scrollY > SCROLL_THRESHOLD);
  }

  function init() {
    if (!navbar) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  return { init };
})();


/* ============================================================
   3. MOBILE MENU
   ============================================================ */

const MobileMenu = (() => {
  const toggleBtn = document.getElementById('menuToggle');
  const menu      = document.getElementById('mobileMenu');

  function isOpen() {
    return toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'true';
  }

  function open() {
    if (!toggleBtn || !menu) return;
    toggleBtn.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close navigation menu');
    menu.classList.add('open');
    document.addEventListener('keydown', onEscape);
    document.addEventListener('click', onOutside);
  }

  function close() {
    if (!toggleBtn || !menu) return;
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    menu.classList.remove('open');
    document.removeEventListener('keydown', onEscape);
    document.removeEventListener('click', onOutside);
  }

  function onEscape(e) {
    if (e.key === 'Escape') close();
  }

  function onOutside(e) {
    if (!menu || !toggleBtn) return;
    if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) close();
  }

  function init() {
    if (!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', () => {
      isOpen() ? close() : open();
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', close);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && isOpen()) close();
    });
  }

  return { init };
})();


/* ============================================================
   4. SMOOTH SCROLLING
   ============================================================ */

const SmoothScroll = (() => {
  function getNavbarHeight() {
    const navbar = document.getElementById('navbar');
    return navbar ? navbar.offsetHeight : 0;
  }

  function scrollToTarget(target) {
    const offset = getNavbarHeight() + 16;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function init() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        scrollToTarget(target);

        if (history.pushState) {
          history.pushState(null, '', href);
        }
      });
    });
  }

  return { init };
})();


/* ============================================================
   5. SCROLL REVEAL — Intersection Observer
   ============================================================ */

const ScrollReveal = (() => {
  const SELECTOR = '.reveal';
  const VISIBLE  = 'visible';

  function buildObserver() {
    return new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(VISIBLE);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );
  }

  function init() {
    const elements = document.querySelectorAll(SELECTOR);
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add(VISIBLE));
      return;
    }

    const observer = buildObserver();
    elements.forEach((el) => observer.observe(el));
  }

  return { init };
})();


/* ============================================================
   6. CHAT MESSAGE REVEAL
   Sequential reveal of conversation messages
   ============================================================ */

const ChatReveal = (() => {
  const VISIBLE = 'is-visible';

  function init() {
    const chat = document.getElementById('methodChat');
    if (!chat || !('IntersectionObserver' in window)) return;

    // Get all static messages except the typing indicator
    const msgs = Array.from(chat.querySelectorAll('.chat-msg:not(.chat-msg--typing)'));
    const typingIndicator = chat.querySelector('.chat-msg--typing');
    if (!msgs.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target);
            playConversation(msgs, typingIndicator);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(chat);
  }

  async function playConversation(msgs, typingIndicator) {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showMessage = (msg) => {
      msg.classList.add(VISIBLE);
    };

    const showTyping = (show) => {
      if (!typingIndicator) return;
      if (show) {
        typingIndicator.classList.add(VISIBLE);
      } else {
        typingIndicator.classList.remove(VISIBLE);
      }
    };

    // Message 1 (Student)
    if (msgs[0]) {
      showMessage(msgs[0]);
      await delay(1200);
    }

    // Message 2 (Nureka) preceded by typing
    if (msgs[1]) {
      showTyping(true);
      await delay(1600);
      showTyping(false);
      showMessage(msgs[1]);
      await delay(1400);
    }

    // Message 3 (Student)
    if (msgs[2]) {
      showMessage(msgs[2]);
      await delay(1000);
    }

    // Message 4 (Nureka) preceded by typing
    if (msgs[3]) {
      showTyping(true);
      await delay(1600);
      showTyping(false);
      showMessage(msgs[3]);
    }
  }

  return { init };
})();


/* ============================================================
   7. CONCEPT CARD — Keyboard accessibility
   ============================================================ */

const ConceptCards = (() => {
  function spawnSparkles(card) {
    const container = card.querySelector('.concept-card__answer-container');
    if (!container) return;
    
    const count = 16;
    const colors = ['#6366F1', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899'];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'sparkle-particle';
      particle.style.left = '50%';
      particle.style.top = '50%';
      
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const distance = 50 + Math.random() * 40;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      
      const size = 6 + Math.random() * 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;
      particle.style.boxShadow = `0 0 10px ${color}`;
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 600);
    }
  }

  function init() {
    document.querySelectorAll('.concept-card').forEach((card) => {
      // Toggle reveal on click
      card.addEventListener('click', () => {
        const wasRevealed = card.classList.contains('is-revealed');
        card.classList.toggle('is-revealed');
        if (!wasRevealed && card.classList.contains('is-revealed')) {
          spawnSparkles(card);
        }
      });

      // Toggle reveal on Enter or Space keys
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const wasRevealed = card.classList.contains('is-revealed');
          card.classList.toggle('is-revealed');
          if (!wasRevealed && card.classList.contains('is-revealed')) {
            spawnSparkles(card);
          }
        }
      });
    });
  }

  return { init };
})();


/* ============================================================
   8. ACTIVE NAV LINK ON SCROLL
   ============================================================ */

const ActiveNav = (() => {
  const ACTIVE_CLASS = 'active';

  function getSections() {
    return Array.from(document.querySelectorAll('section[id]'));
  }

  function getNavLinks() {
    return Array.from(
      document.querySelectorAll('.navbar__nav a[href^="#"], .navbar__nav a[href="index.html"]')
    );
  }

  function setActive(id) {
    getNavLinks().forEach((link) => {
      const href    = link.getAttribute('href');
      const isMatch = href === `#${id}` || (id === '' && href === 'index.html');
      link.classList.toggle(ACTIVE_CLASS, isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function onScroll() {
    const sections  = getSections();
    const scrollMid = window.scrollY + window.innerHeight / 3;

    let current = '';
    sections.forEach((section) => {
      if (section.offsetTop <= scrollMid) {
        current = section.id;
      }
    });

    setActive(current);
  }

  function init() {
    if (!getSections().length) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  return { init };
})();


/* ============================================================
   10. INIT
   ============================================================ */

function init() {
  ThemeManager.init();
  NavbarScroll.init();
  MobileMenu.init();
  SmoothScroll.init();
  ScrollReveal.init();
  ChatReveal.init();
  ConceptCards.init();
  ActiveNav.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}