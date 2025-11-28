// Utilities
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

// mark page loaded (for fade-in)
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-loaded');

    // Elements
    const menuBtn = $('#menuBtn');
    const mobileMenu = $('#mobileMenu');
    const themeToggle = $('#themeToggle');
    const demoBtn = $('#demoBtn');
    const loadDemoBtn = $('#loadDemoBtn');
    const clearDemoBtn = $('#clearDemoBtn');
    const txnBody = $('#txnBody');
    const yrEl = $('#yr');

    // Year in footer
    if (yrEl) yrEl.textContent = new Date().getFullYear();

    // Mobile menu toggle
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
            menuBtn.setAttribute('aria-expanded', String(!expanded));
            mobileMenu.setAttribute('aria-hidden', String(expanded));
        });
        // close menu on outside click
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                mobileMenu.setAttribute('aria-hidden', 'true');
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Theme toggle (persist)
    const saved = localStorage.getItem('pf-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    function setTheme(t) {
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
        localStorage.setItem('pf-theme', t);
        if (themeToggle) themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
    }

    // Smooth internal links + close mobile menu
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (mobileMenu && menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') {
                    mobileMenu.setAttribute('aria-hidden', 'true');
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

    // Intersection observers
    const revealEls = $$('[data-reveal]');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('revealed');
        });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObs.observe(el));

    // fade-slide sections (explicit class)
    const fadeEls = $$('.fade-slide');
    const fadeObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('show');
        });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => fadeObs.observe(el));

    // slide-left/slide-right
    const LR = $$('.slide-left, .slide-right');
    LR.forEach(el => fadeObs.observe(el));

    // highlight steps
    const steps = $$('.highlight-on-scroll');
    const stepObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('highlight-active');
            }
        });
    }, { threshold: 0.45 });
    steps.forEach(s => stepObs.observe(s));

    // sticky-content cards reveal
    const stickyCards = $$('.sticky-content .card');
    stickyCards.forEach(c => fadeObs.observe(c));

    // counters
    const counters = $$('.counter');
    let counterStarted = false;
    function runCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target') || 0;
            const duration = 1400;
            let start = 0;
            const stepTime = Math.max(16, Math.floor(duration / Math.max(1, target / 10)));
            const inc = Math.max(1, Math.floor(target / (duration / stepTime)));
            const timer = setInterval(() => {
                start += inc;
                if (start >= target) {
                    counter.innerText = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.innerText = Math.floor(start).toLocaleString();
                }
            }, stepTime);
        });
    }
    if (counters.length) {
        const counterObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counterStarted) {
                    counterStarted = true;
                    runCounters();
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(c => counterObs.observe(c));
    }

    // demo dashboard data loader
    function populateDemoTransactions() {
        const demo = [
            { id: 'TXN-3247', amount: '₹ 1,200', status: 'Success' },
            { id: 'TXN-3248', amount: '₹ 6,400', status: 'Success' },
            { id: 'TXN-3249', amount: '₹ 500', status: 'Failed' },
            { id: 'TXN-3250', amount: '₹ 22,000', status: 'Pending' },
            { id: 'TXN-3251', amount: '₹ 2,100', status: 'Success' }
        ];
        if (!txnBody) return;
        txnBody.innerHTML = demo.map(t => `<tr><td>${t.id}</td><td>${t.amount}</td><td>${t.status}</td></tr>`).join('');
    }

    loadDemoBtn?.addEventListener('click', () => {
        populateDemoTransactions();
        loadMiniChart();
    });

    clearDemoBtn?.addEventListener('click', () => {
        if (txnBody) txnBody.innerHTML = '';
        clearMiniChart();
    });

    demoBtn?.addEventListener('click', () => {
        const el = $('#dashboard');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        populateDemoTransactions();
        loadMiniChart();
    });

    // openPaymentDemo (mock)
    window.openPaymentDemo = function (type) {
        // an unobtrusive toast fallback
        if (window.toast) { window.toast(`Demo: ${type}`); return; }
        alert(`Opening demo for: ${type}. This is a demo UI action.`);
    };

    // mini chart animation
    function loadMiniChart() {
        const chart = $('#chartArea');
        if (!chart) return;
        chart.innerHTML = '';
        const datapoints = [40, 60, 45, 80, 70, 95, 85];
        const max = Math.max(...datapoints);
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '6px';
        wrapper.style.alignItems = 'end';
        datapoints.forEach((v, i) => {
            const bar = document.createElement('div');
            bar.style.width = '10px';
            bar.style.height = '0px';
            bar.style.background = 'linear-gradient(180deg,#6b5bff,#ff6ec4)';
            bar.style.borderRadius = '6px';
            bar.style.transition = 'height 480ms cubic-bezier(.2,.9,.2,1)';
            bar.style.transitionDelay = `${i * 60}ms`;
            wrapper.appendChild(bar);
            requestAnimationFrame(() => {
                bar.style.height = `${(v / max) * 100}px`;
            });
        });
        chart.appendChild(wrapper);
    }
    function clearMiniChart() { const chart = $('#chartArea'); if (chart) chart.innerHTML = ''; }

    // small reveal utilities for slide-left/slide-right elements
    const animTargets = $$('.slide-left, .slide-right, .fade-slide');
    animTargets.forEach(t => {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('show');
            });
        }, { threshold: 0.12 });
        obs.observe(t);
    });
    document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.escalator-track');
  if (!track) return;

  // allow focus on images for keyboard users
  track.querySelectorAll('img').forEach(img => {
    img.setAttribute('tabindex', '0');
    img.addEventListener('focus', () => { track.style.animationPlayState = 'paused'; });
    img.addEventListener('blur',  () => { track.style.animationPlayState = ''; });
  });

  // When window resizes, restart animation to avoid small glitches
  let resizeTimer;
  const restartAnimation = () => {
    track.style.animation = 'none';
    // force reflow
    void track.offsetWidth;
    track.style.animation = '';
  };
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(restartAnimation, 120);
  });
});
});
