;(function () {
  'use strict'

  // ============================================================
  // UTILITIES
  // ============================================================

  function onReady(fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function rafThrottle(fn) {
    let scheduled = false
    return function () {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        fn()
        scheduled = false
      })
    }
  }

  // ============================================================
  // TOPBAR ACCESS CODE
  // ============================================================

  function initTopbarForm() {
    const btn = document.querySelector('.topbar-btn')
    const input = document.querySelector('.topbar-input')
    if (!btn || !input) return

    const handleJoin = () => {
      const val = input.value.replace(/\s/g, '')
      if (!val) return

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'GoogleAnalyticsEvent',
        eventCategory: 'Landing Site',
        eventAction: 'Header > Join Presentation > User joins a presentation by typing in the access code ' + val
      })

      window.location.href = 'https://audience.ahaslides.com/' + val
    }

    btn.addEventListener('click', handleJoin)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleJoin()
      }
    })
  }

  // ============================================================
  // LAZY VIDEO (IntersectionObserver)
  // ============================================================

  function initLazyVideos() {
    const videos = document.querySelectorAll('video[data-src]')
    if (!videos.length) return

    const interactionEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'mousemove', 'wheel']
    let loaded = false

    const loadVideos = () => {
      if (loaded) return
      loaded = true
      interactionEvents.forEach(ev => window.removeEventListener(ev, loadVideos))

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const v = entry.target
          if (entry.isIntersecting) {
            if (v.dataset.src) {
              v.src = v.dataset.src
              v.removeAttribute('data-src')
              v.load()
            }
            v.play().catch(() => {})
          } else {
            v.pause()
          }
        })
      }, { threshold: 0.25 })

      videos.forEach(v => observer.observe(v))
    }

    interactionEvents.forEach(ev =>
      window.addEventListener(ev, loadVideos, { passive: true })
    )
  }

  // ============================================================
  // GSAP — guard & register
  // ============================================================

  function gsapAvailable() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded. Animations disabled.')
      return false
    }
    gsap.registerPlugin(ScrollTrigger)
    return true
  }

  // ============================================================
  // STICKY STACKING CARDS
  // ============================================================

  // Testimonial: pure scroll listener + getBoundingClientRect — zero GSAP dependency.
  // Bypasses all GSAP ease/default/IX2 interference; inline style always wins.
  function initTestimonialStackingCards() {
    const cards = document.querySelectorAll('.testimonial-card')
    if (!cards.length) return

    gsap.killTweensOf(cards)
    ScrollTrigger.getAll()
      .filter(st => [...cards].some(c => st.trigger === c || st.vars?.trigger === c))
      .forEach(st => st.kill())

    const getStickyTop = (card) => parseFloat(getComputedStyle(card).top) || 0

    cards.forEach((card, i) => {
      card.style.zIndex = i + 1
      card.style.transition = 'none'
      card.style.opacity = ''
      card.style.transform = ''
    })

    const update = () => {
      let activeIndex = -1

      cards.forEach((card, i) => {
        const stickyTop = getStickyTop(card)
        if (card.getBoundingClientRect().top <= stickyTop + 15) activeIndex = i
        card.classList.toggle('card--past', false)

        if (i >= cards.length - 1) return

        const nextCard = cards[i + 1]
        const startY = stickyTop + card.offsetHeight
        const endY = stickyTop
        const nextY = nextCard.getBoundingClientRect().top

        let p = 0
        if (nextY <= endY) p = 1
        else if (nextY < startY) p = (startY - nextY) / (startY - endY)

        card.style.opacity = p > 0 ? String(1 - p) : ''
        card.style.transform = p > 0 ? `scale(${1 - 0.2 * p}) translateZ(0)` : ''
      })

      cards.forEach((card, i) => card.classList.toggle('card--past', i < activeIndex))
    }

    window.addEventListener('scroll', rafThrottle(update), { passive: true })
    window.addEventListener('resize', rafThrottle(update), { passive: true })
    update()
  }

  // ============================================================
  // SCROLL-REVEAL ANIMATIONS
  // ============================================================

  function initRevealAnimations() {
    const defaults = { y: 30, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, start: 'top 85%' }

    const reveal = (trigger, elements, custom) => {
      const triggerEl = document.querySelector(trigger)
      if (!triggerEl) return

      const cfg = { ...defaults, ...custom }
      const els = elements ? triggerEl.querySelectorAll(elements) : [triggerEl]
      if (!els.length) return

      gsap.set(els, { y: cfg.y, opacity: 0 })
      ScrollTrigger.create({
        trigger: triggerEl,
        start: cfg.start,
        onEnter: () => {
          gsap.to(els, { y: 0, opacity: 1, duration: cfg.duration, stagger: cfg.stagger, ease: cfg.ease, overwrite: 'auto' })
        },
        once: true
      })
    }

    reveal('.hero-feature-list', '.feature-card-link')
    reveal('.why-pick-header', 'h2, p')
    reveal('.why-pick-grid', '.why-pick-card', { stagger: 0.15 })
    reveal('.why-pick-cta', '.btn', { stagger: 0.1 })
    reveal('.testimonials-header', 'h2')
    reveal('.trusted-by', 'p, .trusted-logos img', { stagger: 0.05 })
    reveal('.testimonials-cta', '.btn')
    reveal('.distraction-header', '.distraction-cta')
    reveal('.distraction-metrics', '.metric-item', { stagger: 0.2 })
    reveal('.science-header', 'h2')
    reveal('.blog-grid', '.blog-card', { stagger: 0.15 })
    reveal('.science-cta', '.btn')
    reveal('.faq-header', 'h2, p, .faq-contact')
    reveal('.faq-content', '.accordion-item', { stagger: 0.1 })
    reveal('.main-footer', '.footer-column, .footer-brand, .footer-bottom > *', { stagger: 0.05, start: 'top 95%' })
  }

  // ============================================================
  // DISTRACTION HEADER — per-character scroll opacity
  // ============================================================

  function initDistractionHeader() {
    const header = document.querySelector('.distraction-header')
    if (!header) return

    const headings = header.querySelectorAll('h2')

    headings.forEach(h2 => {
      const text = h2.textContent
      h2.textContent = ''
      for (const char of text) {
        const span = document.createElement('span')
        span.className = 'distraction-h2-char'
        span.textContent = char
        span.style.opacity = '0.3'
        h2.appendChild(span)
      }
    })

    const charGroups = Array.from(headings).map(h2 =>
      Array.from(h2.querySelectorAll('.distraction-h2-char'))
    )

    const others = [...header.children].filter(el => el.tagName !== 'H2')
    gsap.set(others, { y: 30, opacity: 0 })

    const isMobile = window.matchMedia('(max-width: 767px)').matches

    ScrollTrigger.create({
      trigger: header,
      start: isMobile ? 'top 95%' : 'top 85%',
      onEnter: () => gsap.to(others, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }),
      once: true
    })

    ScrollTrigger.create({
      trigger: header,
      start: isMobile ? 'top 95%' : 'top 85%',
      end: isMobile ? 'bottom 40%' : 'bottom 50%',
      onUpdate: (self) => {
        const progress = self.progress
        charGroups.forEach(chars => {
          const N = chars.length
          chars.forEach((span, i) => {
            const t = Math.max(0, Math.min(1, (progress - i / N) / (1 / N)))
            span.style.opacity = (0.3 + 0.7 * t).toFixed(4)
          })
        })
      }
    })
  }

  // ============================================================
  // FAQ ACCORDION
  // ============================================================

  function initAccordion() {
    const items = [...document.querySelectorAll('.accordion-item')]
    if (!items.length) return

    const MINUS = '<path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"></path>'
    const PLUS = '<path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"></path>'
    const SWAP_DELAY = 200

    const entries = items.map(item => ({
      item,
      header: item.querySelector('.accordion-header'),
      icon: item.querySelector('.accordion-icon')
    }))

    function setItem(entry, active, animate) {
      const was = entry.item.classList.contains('active')
      entry.item.classList.toggle('active', active)
      if (!entry.icon) return

      const path = active ? MINUS : PLUS
      if (!animate || was === active) {
        entry.icon.innerHTML = path
        return
      }
      setTimeout(() => { entry.icon.innerHTML = path }, SWAP_DELAY)
    }

    entries.forEach(entry => {
      setItem(entry, entry.item.classList.contains('active'), false)

      if (!entry.header) return
      entry.header.addEventListener('click', () => {
        const willOpen = !entry.item.classList.contains('active')
        entries.forEach(e => setItem(e, false, true))
        if (willOpen) setItem(entry, true, true)
      })
    })
  }

  // ============================================================
  // METRIC COUNTER
  // ============================================================

  function initMetricCounters() {
    document.querySelectorAll('.metric-number').forEach(el => {
      const target = parseFloat(el.getAttribute('data-target'))
      const suffix = el.getAttribute('data-suffix') || ''
      const obj = { value: 0 }

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(obj, {
            value: target,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = (target % 1 === 0 ? Math.floor(obj.value) : obj.value.toFixed(1)) + suffix
            }
          })
        },
        once: true
      })
    })
  }

  // ============================================================
  // BOOTSTRAP
  // ============================================================

  onReady(() => {
    if (window.__ahaMainInitialized) return
    window.__ahaMainInitialized = true

    // Non-GSAP features
    initTopbarForm()
    initLazyVideos()

    // GSAP-dependent features
    if (!gsapAvailable()) return

    initTestimonialStackingCards()
    initRevealAnimations()
    initDistractionHeader()
    initAccordion()
    initMetricCounters()
  })
})()
