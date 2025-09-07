// main.js - responsive nav + scroll reveal
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var toggle = document.querySelector('.mobile-toggle');
    var nav = document.getElementById('primary-nav');
    var backToTopBtn = document.getElementById('back-to-top');

    // Toggle mobile nav
    if (toggle && nav) {
      toggle.addEventListener('click', function(){
        var open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      // Close menu on nav link click
      nav.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){
          document.body.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on resize to desktop
      window.addEventListener('resize', function(){
        if (window.innerWidth >= 992) {
          document.body.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Scroll reveal animations with subtle stagger
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      // apply a base transition delay per element to create a soft stagger
      reveals.forEach(function(el, i){
        var base = 60; // ms
        el.style.transitionDelay = (i * base) + 'ms';
      });

      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      reveals.forEach(function(el){ io.observe(el); });
    } else {
      // Fallback: show immediately
      reveals.forEach(function(el){ el.classList.add('show'); });
    }

    // --- Journey timeline activation (no progress fill) ---
    (function(){
      var tl = document.querySelector('.journey .timeline');
      if (!tl) return;

      var items = Array.prototype.slice.call(document.querySelectorAll('.journey .timeline-item'));

      // Activate items on intersection
      if ('IntersectionObserver' in window) {
        var itemIO = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              itemIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.25 });
        items.forEach(function(it){ itemIO.observe(it); });
      } else {
        items.forEach(function(it){ it.classList.add('active'); });
      }
    })();

    // --- Responsive layered image sizing via CSS variables ---
    var aboutImg = document.querySelector('.about-img');
    function applyLayerLayout() {
      if (!aboutImg) return;
      // Compute a fluid width based on viewport, tuned for a transparent PNG portrait
      var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      var base = Math.round(vw * 0.30); // 30vw baseline (smaller)
      var imgW = Math.max(240, Math.min(360, base));
      var imgH = Math.round(imgW * 0.75); // 4:3 ratio

      // Scale offsets relative to a 360px reference
      var scale = imgW / 360;
      var p1x = Math.round(-16 * scale), p1y = Math.round(-12 * scale);
      var p2x = Math.round(16 * scale),  p2y = Math.round(-12 * scale);
      var p3x = Math.round(40 * scale);
      // Padding around layers (border mats) scales with size, but clamped
      var pad = Math.max(16, Math.min(48, Math.round(40 * scale)));

      aboutImg.style.setProperty('--img-w', imgW + 'px');
      aboutImg.style.setProperty('--img-h', imgH + 'px');
      aboutImg.style.setProperty('--p1x', p1x + 'px');
      aboutImg.style.setProperty('--p1y', p1y + 'px');
      aboutImg.style.setProperty('--p2x', p2x + 'px');
      aboutImg.style.setProperty('--p2y', p2y + 'px');
      aboutImg.style.setProperty('--p3x', p3x + 'px');
      aboutImg.style.setProperty('--pad', pad + 'px');
    }

    applyLayerLayout();
    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyLayerLayout, 100);
    });

    // --- Hide nav on scroll down, show on scroll up ---
    (function(){
      var nav = document.querySelector('nav');
      if (!nav) return;
      var lastY = window.pageYOffset || 0;
      var ticking = false;
      var threshold = 10; // minimal delta to react
      var TOP_LOCK = 80;  // always show when within 80px from top
      var HIDE_AFTER = 120; // only allow hide after this depth
      function onScroll(){
        if (ticking) return; ticking = true;
        requestAnimationFrame(function(){
          var y = window.pageYOffset || 0;
          var delta = y - lastY;
          var navOpen = document.body.classList.contains('nav-open');

          // Always show when near the very top
          if (y <= TOP_LOCK) {
            nav.classList.remove('nav-hidden');
            lastY = y;
            ticking = false;
            return;
          }

          if (!navOpen) {
            if (y > HIDE_AFTER && delta > threshold) {
              nav.classList.add('nav-hidden');
            } else if (delta < -threshold) {
              nav.classList.remove('nav-hidden');
            }
          } else {
            nav.classList.remove('nav-hidden');
          }
          lastY = y;
          ticking = false;
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
    })();

    // --- Scroll progress integrated into Back-to-top (circular ring) ---
    (function(){
      if (!backToTopBtn) return;
      function update(){
        var scrollTop = window.scrollY || window.pageYOffset || 0;
        var docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        var winH = window.innerHeight || document.documentElement.clientHeight || 1;
        var total = Math.max(1, docH - winH);
        var pct = Math.min(100, Math.max(0, (scrollTop / total) * 100));
        backToTopBtn.style.setProperty('--progress', pct);
      }
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      window.addEventListener('load', update);
      update();
    })();

    // --- Back to top button behavior ---
    (function(){
      if (!backToTopBtn) return;
      function onScroll(){
        var y = window.scrollY || window.pageYOffset;
        if (y > 300) backToTopBtn.classList.add('show'); else backToTopBtn.classList.remove('show');
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      backToTopBtn.addEventListener('click', function(){
        var reduce = false;
        try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(_) {}
        if (reduce) { window.scrollTo(0, 0); return; }
        // Use same easing feel as links
        var startY = window.pageYOffset;
        var targetY = 0;
        var diff = targetY - startY;
        var startTime = null;
        function easeInOutCubic(t){
          return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
        }
        function step(ts){
          if (!startTime) startTime = ts;
          var p = Math.min(1, (ts - startTime) / 720);
          var eased = easeInOutCubic(p);
          window.scrollTo(0, Math.round(startY + diff * eased));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    })();

    // (Removed earlier duplicate smooth scroll block to avoid double handling)

    // --- Contact form: AJAX submit with in-page alerts ---
    (function(){
      var form = document.querySelector('.contact-form');
      if (!form) return;

      var alertBox = form.querySelector('.form-alert');
      var submitBtn = form.querySelector('.btn-submit');

      function showAlert(type, message) {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.hidden = false;
        alertBox.classList.remove('success', 'error');
        alertBox.classList.add(type === 'success' ? 'success' : 'error');
      }

      function clearAlert(){
        if (!alertBox) return;
        alertBox.hidden = true;
        alertBox.textContent = '';
        alertBox.classList.remove('success', 'error');
      }

      form.addEventListener('submit', function(e){
        e.preventDefault();

        clearAlert();
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.prevText = submitBtn.textContent;
          submitBtn.textContent = 'Sending...';
        }

        var fd = new FormData(form);
        // Honeypot: if filled, treat as success silently
        if (fd.get('_honey')) {
          showAlert('success', 'Thank you!');
          form.reset();
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.prevText || 'Send Message'; }
          return;
        }

        fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        }).then(function(res){
          if (res.ok) return res.json().catch(function(){ return {}; });
          // Attempt to parse error JSON; if fails, throw generic
          return res.json().then(function(data){
            var msg = (data && (data.message || data.error)) || 'Failed to send. Please try again later.';
            throw new Error(msg);
          }).catch(function(){
            throw new Error('Failed to send. Please try again later.');
          });
        }).then(function(){
          showAlert('success', 'Your message has been sent successfully. I will get back to you soon.');
          form.reset();
        }).catch(function(err){
          showAlert('error', err && err.message ? err.message : 'Network error. Please try again.');
        }).finally(function(){
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.prevText || 'Send Message';
          }
        });
      });
    })();

    // --- Force download for CV link (attempt Blob download, fallback to normal) ---
    (function(){
      var cvLink = document.querySelector('a.cv');
      if (!cvLink) return;

      var href = cvLink.getAttribute('href');
      var filename = cvLink.getAttribute('download') || 'CV.pdf';

      cvLink.addEventListener('click', function(e){
        // If no href, do nothing
        if (!href) return;
        e.preventDefault();
        try {
          // Attempt to fetch and save as Blob (best chance to force download)
          fetch(href).then(function(res){
            if (!res.ok) throw new Error('Network error');
            return res.blob();
          }).then(function(blob){
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function(){
              URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }, 200);
          }).catch(function(){
            // Fallback to default behavior if fetch blocked (e.g., file://)
            window.location.href = href;
          });
        } catch(_) {
          // Last-resort fallback
          window.location.href = href;
        }
      });
    })();

    // --- Page Loader: enforce minimum display time ---
    (function(){
      var loader = document.getElementById('page-loader');
      if (!loader) return;

      var MIN_DISPLAY_MS = 1100; // snappy minimum ~0.8s visible
      var MAX_FAILSAFE_MS = 30000; // absolute max in case 'load' never fires
      var start = Date.now();

      function actuallyHide(){
        if (document.body.classList.contains('loaded')) return;
        document.body.classList.add('loaded');
        // remove from DOM after transition to keep DOM clean
        setTimeout(function(){
          if (loader && loader.parentNode) {
            try { loader.parentNode.removeChild(loader); } catch(_) {}
          }
        }, 600);
      }

      function scheduleHide(){
        var elapsed = Date.now() - start;
        var wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(actuallyHide, wait);
      }

      // When window fully loads, schedule hide respecting min duration
      window.addEventListener('load', function(){
        scheduleHide();
      });

      // Hard failsafe: ensure loader goes away eventually even if 'load' doesn't fire
      setTimeout(actuallyHide, MAX_FAILSAFE_MS);
    })();

    // --- Image Lightbox for Portfolio ---
    (function(){
      var lightbox = document.getElementById('image-lightbox');
      if (!lightbox) return;
      var imgEl = lightbox.querySelector('img');
      var closeBtn = lightbox.querySelector('.close-btn');
      var content = lightbox.querySelector('.content');

      function openLightbox(src, alt){
        if (!src) return;
        imgEl.src = src;
        imgEl.alt = alt || '';
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        // focus the close button for accessibility
        setTimeout(function(){ try{ closeBtn.focus(); }catch(_){} }, 0);
        document.addEventListener('keydown', onKeyDown);
      }

      function closeLightbox(){
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', onKeyDown);
        // clear src after transition to allow GC
        setTimeout(function(){ imgEl.src = ''; }, 250);
      }

      function onKeyDown(e){ if (e.key === 'Escape') closeLightbox(); }

      // Click outside content (overlay) closes
      lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
      // Prevent overlay close when clicking inside content
      if (content) content.addEventListener('click', function(e){ e.stopPropagation(); });
      if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

      // Attach to portfolio/grid images
      var selector = '.portfolio .card img';
      var imgs = document.querySelectorAll(selector);
      imgs.forEach(function(img){
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(){
          var alt = img.getAttribute('alt') || (img.closest('.card') && img.closest('.card').querySelector('span') ? img.closest('.card').querySelector('span').textContent.trim() : '');
          openLightbox(img.getAttribute('src'), alt);
        });
      });
    })();

    // --- Smooth scroll for in-page anchors with easing + ScrollSpy ---
    (function(){
      var anchors = document.querySelectorAll('a[href^="#"]');
      if (!anchors.length) return;

      function getOffset() {
        var nav = document.querySelector('nav');
        return (nav ? nav.getBoundingClientRect().height : 0) + 10;
      }

      function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }

      function animateScrollTo(targetY, duration) {
        var startY = window.scrollY;
        var diff = targetY - startY;
        var startTime = null;
        duration = Math.max(250, duration || 700);
        function step(ts) {
          if (!startTime) startTime = ts;
          var t = Math.min(1, (ts - startTime) / duration);
          var eased = easeInOutCubic(t);
          window.scrollTo(0, startY + diff * eased);
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      anchors.forEach(function(anchor){
        anchor.addEventListener('click', function(e){
          var href = anchor.getAttribute('href');
          if (!href || href === '#') return;
          var target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - getOffset();
          animateScrollTo(top, 720);
          try { history.pushState(null, '', href); } catch(_) {}
          document.body.classList.remove('nav-open');
        });
      });

      // ScrollSpy: highlight active nav link
      var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav .nav-center a'));
      var sections = navLinks.map(function(a){
        var id = a.getAttribute('href');
        var el = id ? document.querySelector(id) : null;
        return { a: a, id: id, el: el };
      }).filter(function(x){ return x.el; });

      function setActive(id){
        navLinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === id); });
      }

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if (entry.isIntersecting) {
              var m = sections.find(function(s){ return s.el === entry.target; });
              if (m) setActive(m.id);
            }
          });
        }, { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 });
        sections.forEach(function(s){ io.observe(s.el); });
      } else {
        function onScroll(){
          var y = window.scrollY + getOffset() + 20;
          var current = sections[0] && sections[0].id;
          sections.forEach(function(s){
            var top = s.el.offsetTop;
            if (y >= top) current = s.id;
          });
          setActive(current);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    })();

  });
})();
