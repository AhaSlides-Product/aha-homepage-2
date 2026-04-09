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
  // HEADER SHOW / HIDE
  // ============================================================

  function initHeaderScroll() {
    const header = document.querySelector('.header.navbar-2')
    if (!header) return

    const THRESHOLD = 170
    let lastY = window.scrollY
    let passed = false

    const update = () => {
      const y = window.scrollY
      const up = y < lastY

      if (y <= THRESHOLD) {
        header.classList.remove('header--hidden')
        passed = false
      } else if (!passed) {
        header.classList.add('header--hidden')
        passed = true
      } else if (up) {
        header.classList.remove('header--hidden')
      } else {
        header.classList.add('header--hidden')
      }

      lastY = y
    }

    window.addEventListener('scroll', rafThrottle(update), { passive: true })
  }

  // ============================================================
  // LAZY VIDEO (IntersectionObserver)
  // ============================================================

  function initLazyVideos() {
    const videos = document.querySelectorAll('video[loop][muted]')
    if (!videos.length) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.play().catch(() => {})
        else entry.target.pause()
      })
    }, { threshold: 0.25 })

    videos.forEach(v => observer.observe(v))
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

  function setupStackingCards(cardSelector, getStart) {
    const cards = document.querySelectorAll(cardSelector)
    if (!cards.length) return

    ScrollTrigger.getAll()
      .filter(st => [...cards].some(c => st.trigger === c || st.vars?.trigger === c))
      .forEach(st => st.kill())

    const getStickyTop = (card) => parseFloat(getComputedStyle(card).top) || 0

    cards.forEach((card, i) => {
      card.style.zIndex = i + 1
      gsap.set(card, { clearProps: 'scale,opacity' })

      if (i < cards.length - 1) {
        const nextCard = cards[i + 1]

        gsap.to(card, {
          scale: 0.8,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: () => getStart(card, getStickyTop(card)),
            end: () => `top ${getStickyTop(card)}px`,
            scrub: true,
            invalidateOnRefresh: true
          }
        })
      }
    })

    const updateActive = () => {
      let activeIndex = -1
      cards.forEach((card, i) => {
        if (card.getBoundingClientRect().top <= getStickyTop(card) + 15) activeIndex = i
      })

      cards.forEach((card, i) => {
        card.classList.toggle('card--past', i < activeIndex)
      })
    }

    window.addEventListener('scroll', rafThrottle(updateActive), { passive: true })
    updateActive()
  }

  function initUsecaseStackingCards() {
    setupStackingCards('.usecase-card', (card, stickyTop) => {
      return `top ${stickyTop + card.offsetHeight}px`
    })
  }

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
  // "THERE'S MORE!" CARD ILLUSTRATION
  // ============================================================

  function initMoreCardAnimation() {
    const card = document.querySelector('.usecase-card[data-index="4"]')
    if (!card) return

    const items = card.querySelectorAll('.more-item')
    const main = card.querySelector('.more-main')

    const build = (opts) => {
      gsap.set(items, { y: 400 })
      gsap.set(main, { y: 220 })

      gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: opts.end,
          scrub: opts.scrub,
          invalidateOnRefresh: true
        }
      })
        .to([items, main], { y: 0, stagger: 0.08, duration: 1.2, ease: 'power2.out' })
        .to('.item-1', { y: opts.dispersalLg, duration: 2, ease: 'power1.out' }, 1.2)
        .to('.item-2', { y: opts.dispersalLg, duration: 2, ease: 'power1.out' }, 1.3)
        .to('.item-3', { y: opts.dispersalSm, duration: 2, ease: 'power1.out' }, 1.4)
        .to('.item-4', { y: opts.dispersalSm, duration: 2, ease: 'power1.out' }, 1.5)
    }

    const endOffset = () => 'bottom top+=' + window.innerHeight * 1.4

    const mm = gsap.matchMedia()
    mm.add({
      small:  '(max-width: 478px)',
      medium: '(min-width: 479px) and (max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 991px)',
      desktop:'(min-width: 992px)'
    }, (ctx) => {
      const { small, medium, tablet } = ctx.conditions
      if (small)       build({ end: endOffset, scrub: 2, dispersalLg: -80, dispersalSm: -100 })
      else if (medium) build({ end: endOffset, scrub: 2, dispersalLg: -150, dispersalSm: -120 })
      else if (tablet) build({ end: endOffset, scrub: 2, dispersalLg: -110, dispersalSm: -80 })
      else             build({ end: endOffset, scrub: 1.5, dispersalLg: -140, dispersalSm: -80 })
    })
  }

  // ============================================================
  // THEME TRANSITIONS (CSS custom properties)
  // ============================================================

  function initThemeTransitions() {
    const root = document.documentElement

    const zones = [
      {
        trigger: '.gradient-transition-hero',
        vars: { '--theme-bg': '#1a1a2e', '--theme-text': '#ffffff' },
        start: 'top 80%', end: 'top 75%'
      },
      {
        trigger: '.gradient-transition-why-pick',
        vars: { '--theme-2-bg': '#FFF', '--theme-2-gradient-start': '#FFF' },
        start: 'center 80%', end: 'center 20%'
      },
    ]

    zones.forEach(({ trigger, vars, start, end }) => {
      const el = document.querySelector(trigger)
      if (!el) return
      gsap.to(root, { ...vars, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 1 } })
    })

    // Binary class toggles: parallel to GSAP tween for properties that can't use CSS variables (images, filters, etc.)
    const classToggles = [
      {
        trigger: '.gradient-transition-hero',
        start: 'top 80%',
        cls: 'theme-dark',
        target: root,
      },
      // Add new zones here as needed:
      // { trigger: '.gradient-transition-why-pick', start: 'center 80%', cls: 'theme-light', target: root },
    ]

    classToggles.forEach(({ trigger, start, cls, target }) => {
      const el = document.querySelector(trigger)
      if (!el) return
      ScrollTrigger.create({
        trigger: el,
        start,
        onEnter: () => target.classList.add(cls),
        onLeaveBack: () => target.classList.remove(cls),
      })
    })
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

    reveal('.hero-homepage', '.hero-title, .btn.is-pink, .hero-feature-list > *')
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
  // "WELCOME TO THE SHOW" — Create section entrance
  // ============================================================

  function initCreateSectionEntrance() {
    const title = document.querySelector('.create-main-title')
    const firstCard = document.querySelector('.usecase-card[data-index="0"]')
    if (!title || !firstCard) return

    const imageWrap = firstCard.querySelector('.usecase-card__image-wrap')
    const contentEls = firstCard.querySelector('.usecase-card__content')?.children || []

    let words = title.querySelectorAll('.create-h2-word')
    if (!words.length) {
      title.innerHTML = title.textContent.trim().split(/\s+/)
        .map(w => `<span class="create-h2-word" style="display:inline-block">${w}</span>`)
        .join(' ')
      words = title.querySelectorAll('.create-h2-word')
    }

    const underline = title.parentElement.querySelector('.ai-underline-trigger')

    gsap.set(words, { y: 28, opacity: 0 })
    gsap.set(imageWrap, { y: 80, scale: 0.9, opacity: 0 })
    gsap.set(contentEls, { y: 20, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    if (words.length) {
      tl.to(words, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(1.4)', overwrite: true })
    }
    if (underline) {
      tl.to(underline, { onStart: () => underline.classList.add('ai-underline-active'), duration: 0.1 }, '-=0.2')
    }
    tl.to(imageWrap, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2)
    tl.to(contentEls, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 0.5)

    ScrollTrigger.create({
      trigger: '#what-you-can-create',
      start: 'top 80%',
      onEnter: () => tl.play(),
      once: true
    })
  }

  // ============================================================
  // DISTRACTION HEADER — per-character scroll opacity
  // ============================================================

  function initDistractionHeader() {
    const header = document.querySelector('.distraction-header')
    if (!header) return

    const section = header.closest('.distraction-section')
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
    initHeaderScroll()
    initLazyVideos()

    // GSAP-dependent features
    if (!gsapAvailable()) return

    initUsecaseStackingCards()
    initTestimonialStackingCards()
    initMoreCardAnimation()
    initThemeTransitions()
    initRevealAnimations()
    initCreateSectionEntrance()
    initDistractionHeader()
    initAccordion()
    initMetricCounters()
  })
})()
